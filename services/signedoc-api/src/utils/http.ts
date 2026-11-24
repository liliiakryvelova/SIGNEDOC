import { app, type HttpMethod, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { CurrentUser, DocumentRecord, PublicRecipient, Recipient } from '../../../shared/types/entities.js';
import { handleError } from '../errors/errorHandler.js';
import { ConflictError, GoneError, NotFoundError, RateLimitError, UnauthorizedError } from '../errors/errorTypes.js';
import { getServices } from '../services/registry.js';
import { logger } from '../logger.js';

export type HttpHandler = (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>;
export function registerHttp(name: string, method: HttpMethod, route: string, handler: HttpHandler): void {
  app.http(name, { methods: [method], authLevel: 'anonymous', route, handler: async (request, context) => {
    const started = Date.now();
    try {
      const response = await handler(request, context);
      logger.info({ method: request.method, path: new URL(request.url).pathname, status: response.status ?? 200, durationMs: Date.now() - started, functionName: name }, 'HTTP request completed');
      return response;
    } catch (error) {
      const response = handleError(error, context);
      logger.info({ method: request.method, path: new URL(request.url).pathname, status: response.status ?? 500, durationMs: Date.now() - started, functionName: name }, 'HTTP request failed');
      return response;
    }
  } });
}

export async function requireUser(request: HttpRequest): Promise<CurrentUser> {
  const user = await getServices().auth.authenticate(request.headers.get('authorization'));
  if (!user) throw new UnauthorizedError();
  return user;
}
export function hashToken(token: string): string { return createHash('sha256').update(token).digest('hex'); }
export function newSigningToken(): string { return randomBytes(32).toString('base64url'); }
export function newId(): string { return randomUUID(); }
const rateWindows = new Map<string, number[]>();
export function rateLimit(request: HttpRequest, scope: string, limit: number, windowMs: number): void {
  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const key = `${scope}:${address}`; const now = Date.now();
  const recent = (rateWindows.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= limit) throw new RateLimitError();
  recent.push(now); rateWindows.set(key, recent);
  if (rateWindows.size > 5000) for (const [entry, timestamps] of rateWindows) if (timestamps.every((timestamp) => now - timestamp >= windowMs)) rateWindows.delete(entry);
}
export async function requireOwnedDocument(id: string, user: CurrentUser): Promise<DocumentRecord> {
  const document = await getServices().database.findById<DocumentRecord>('documents', id);
  if (!document || document.ownerId !== user.id) throw new NotFoundError('Document not found.');
  return document;
}
export async function getValidRecipient(token: string): Promise<Recipient> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new NotFoundError('This signing link is not valid.');
  const recipient = await getServices().database.findOne<Recipient>('recipients', { tokenHash: hashToken(token) });
  if (!recipient) throw new NotFoundError('This signing link is not valid.');
  if (recipient.expiresAt && new Date(recipient.expiresAt).getTime() <= Date.now()) throw new GoneError('This signing link has expired.');
  if (recipient.status === 'completed') throw new ConflictError('This document has already been signed.');
  return recipient;
}
export function toPublicRecipient(recipient: Recipient): PublicRecipient {
  return { id: recipient.id, name: recipient.name, email: recipient.email, status: recipient.status, expiresAt: recipient.expiresAt, signedAt: recipient.signedAt };
}