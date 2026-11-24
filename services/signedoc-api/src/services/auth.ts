import { createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { CurrentUser, User } from '../../../shared/types/entities.js';
import type { AppConfig } from './config.js';
import type { IDatabaseService } from './interfaces/IDatabaseService.js';
import type { IAuthService } from './interfaces/IAuthService.js';
import { ConflictError, UnauthorizedError } from '../errors/errorTypes.js';

function encode(value: object): string { return Buffer.from(JSON.stringify(value)).toString('base64url'); }
function toCurrentUser(user: User): CurrentUser { return { id: user.id, email: user.email, displayName: user.displayName }; }

export class DatabaseAuthService implements IAuthService {
  constructor(private readonly database: IDatabaseService, private readonly config: AppConfig) {}
  private token(user: User): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = encode({ sub: user.id, iss: this.config.jwtIssuer, aud: this.config.jwtAudience, iat: now, exp: now + 60 * 60 });
    const body = `${encode({ alg: 'HS256', typ: 'JWT' })}.${payload}`;
    return `${body}.${createHmac('sha256', this.config.jwtSecret).update(body).digest('base64url')}`;
  }
  private async authenticated(user: User) { return { user: toCurrentUser(user), accessToken: this.token(user) }; }
  async register(input: { name: string; email: string; password: string }) {
    if (await this.database.findOne<User>('users', { email: input.email })) throw new ConflictError('An account with that email already exists.');
    const now = new Date().toISOString();
    const user = await this.database.create<User>('users', { id: crypto.randomUUID(), displayName: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 12), createdAt: now, updatedAt: now });
    return this.authenticated(user);
  }
  async login(input: { email: string; password: string }) {
    const user = await this.database.findOne<User>('users', { email: input.email });
    if (!user?.passwordHash || !await bcrypt.compare(input.password, user.passwordHash)) throw new UnauthorizedError('Email or password is incorrect.');
    return this.authenticated(user);
  }
  async getUser(id: string): Promise<User | null> { return this.database.findById<User>('users', id); }
  async authenticate(authorization: string | null): Promise<CurrentUser | null> {
    if (!authorization?.startsWith('Bearer ')) return null;
    const [header, payload, signature, extra] = authorization.slice(7).split('.');
    if (!header || !payload || !signature || extra) return null;
    try {
      const body = `${header}.${payload}`;
      const expected = createHmac('sha256', this.config.jwtSecret).update(body).digest();
      const received = Buffer.from(signature, 'base64url');
      if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
      const headerValue = JSON.parse(Buffer.from(header, 'base64url').toString('utf8')) as { alg?: string };
      const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: string; iss?: string; aud?: string; exp?: number };
      if (headerValue.alg !== 'HS256' || claims.iss !== this.config.jwtIssuer || claims.aud !== this.config.jwtAudience || !claims.sub || !claims.exp || claims.exp <= Date.now() / 1000) return null;
      const user = await this.getUser(claims.sub);
      return user ? toCurrentUser(user) : null;
    } catch { return null; }
  }
}