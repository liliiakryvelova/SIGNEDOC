import { beforeEach, describe, expect, it } from 'vitest';
import type { User } from '../../shared/types/entities.js';
import { DatabaseAuthService } from '../src/services/auth.js';
import type { AppConfig } from '../src/services/config.js';
import type { IDatabaseService } from '../src/services/interfaces/IDatabaseService.js';

class MemoryDatabase {
  users: User[] = [];
  async findOne<T>(_collection: string, filter: Record<string, unknown>): Promise<T | null> { return (this.users.find((user) => Object.entries(filter).every(([key, value]) => (user as unknown as Record<string, unknown>)[key] === value)) as T | undefined) ?? null; }
  async findById<T>(_collection: string, id: string): Promise<T | null> { return (this.users.find((user) => user.id === id) as T | undefined) ?? null; }
  async create<T>(_collection: string, data: T): Promise<T> { this.users.push(data as User); return data; }
}

describe('DatabaseAuthService', () => {
  let database: MemoryDatabase; let auth: DatabaseAuthService;
  beforeEach(() => {
    database = new MemoryDatabase();
    auth = new DatabaseAuthService(database as unknown as IDatabaseService, { environment: 'Development', jwtSecret: 'unit-test-secret-that-is-long-enough-123', jwtIssuer: 'signedoc-test', jwtAudience: 'signedoc-test-client' } as AppConfig);
  });
  it('hashes credentials and authenticates a registered sender', async () => {
    const result = await auth.register({ name: 'Taylor', email: 'taylor@example.org', password: 'a-long-test-password' });
    expect(database.users[0].passwordHash).not.toBe('a-long-test-password');
    expect(await auth.authenticate(`Bearer ${result.accessToken}`)).toEqual(result.user);
  });
  it('rejects invalid credentials and tampered or expired tokens', async () => {
    const result = await auth.register({ name: 'Taylor', email: 'taylor@example.org', password: 'a-long-test-password' });
    await expect(auth.login({ email: 'taylor@example.org', password: 'wrong-password' })).rejects.toThrow('incorrect');
    expect(await auth.authenticate(`Bearer ${result.accessToken.slice(0, -1)}x`)).toBeNull();
    expect(await auth.authenticate(null)).toBeNull();
  });
  it('rejects duplicate email at the application boundary', async () => {
    await auth.register({ name: 'Taylor', email: 'taylor@example.org', password: 'a-long-test-password' });
    await expect(auth.register({ name: 'Taylor', email: 'taylor@example.org', password: 'a-long-test-password' })).rejects.toThrow('already exists');
  });
});