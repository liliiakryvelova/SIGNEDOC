import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import type { AuditEvent, CurrentUser, DocumentRecord, Recipient, User } from '../../shared/types/entities.js';
import type { IDatabaseService } from '../src/services/interfaces/IDatabaseService.js';
import type { Services } from '../src/services/registry.js';

const registrations = vi.hoisted(() => ({ routes: new Map<string, { methods: string[]; route: string; handler: (request: unknown, context: unknown) => Promise<unknown> }>() }));

vi.mock('@azure/functions', () => ({
  app: { http: (name: string, options: { methods: string[]; route: string; handler: (request: unknown, context: unknown) => Promise<unknown> }) => registrations.routes.set(name, options) },
}));
vi.mock('../src/logger.js', () => ({ logger: { info: vi.fn() } }));

import '../src/index.js';
import { clearServices, registerServices } from '../src/services/registry.js';

type Row = Record<string, unknown>;

class MemoryDatabase {
  private readonly rows = new Map<string, Row[]>();
  async findAll<T>(collection: string, options: { filter?: Record<string, unknown>; orderBy?: string; orderDirection?: 'asc' | 'desc'; limit?: number; offset?: number } = {}): Promise<T[]> {
    const rows = [...(this.rows.get(collection) ?? [])].filter((row) => Object.entries(options.filter ?? {}).every(([key, value]) => row[key] === value));
    if (options.orderBy) rows.sort((a, b) => String(a[options.orderBy!] ?? '').localeCompare(String(b[options.orderBy!] ?? '')) * (options.orderDirection === 'desc' ? -1 : 1));
    return rows.slice(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? rows.length)).map((row) => ({ ...row }) as T);
  }
  async findById<T>(collection: string, id: string): Promise<T | null> { return ((this.rows.get(collection) ?? []).find((row) => row.id === id) as T | undefined) ?? null; }
  async findOne<T>(collection: string, filter: Record<string, unknown>): Promise<T | null> { return (await this.findAll<T>(collection, { filter, limit: 1 }))[0] ?? null; }
  async create<T>(collection: string, data: T): Promise<T> { const rows = this.rows.get(collection) ?? []; rows.push({ ...(data as Row) }); this.rows.set(collection, rows); return data; }
  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
    const row = (this.rows.get(collection) ?? []).find((candidate) => candidate.id === id);
    if (!row) return null;
    Object.assign(row, data);
    return { ...row } as T;
  }
  async delete(collection: string, id: string): Promise<boolean> { const rows = this.rows.get(collection) ?? []; const index = rows.findIndex((row) => row.id === id); if (index < 0) return false; rows.splice(index, 1); return true; }
  async count(collection: string, filter?: Record<string, unknown>): Promise<number> { return (await this.findAll(collection, { filter })).length; }
  async healthCheck(): Promise<boolean> { return true; }
  async transaction<T>(callback: (database: IDatabaseService) => Promise<T>): Promise<T> { return callback(this as unknown as IDatabaseService); }
}

const currentUser: CurrentUser = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'sender@example.org', displayName: 'Test Sender' };
const bearerToken = 'smoke-test-token';
const context = { warn: vi.fn(), error: vi.fn() };
let database: MemoryDatabase;
let storedFiles: Map<string, Buffer>;
let invitationUrl: string;
let pdfBytes: Buffer;

async function call<T>(name: string, options: { method?: string; params?: Record<string, string>; query?: Record<string, string>; body?: unknown; bytes?: Buffer; headers?: Record<string, string> } = {}) {
  const registration = registrations.routes.get(name);
  if (!registration) throw new Error(`HTTP function ${name} was not registered.`);
  const bytes = options.bytes ?? Buffer.alloc(0);
  const request = {
    method: options.method ?? registration.methods[0],
    url: `http://localhost:7071/api/${registration.route.replaceAll('{id}', options.params?.id ?? '').replaceAll('{token}', options.params?.token ?? '')}`,
    params: options.params ?? {},
    query: new URLSearchParams(options.query),
    headers: new Headers(options.headers),
    json: async () => options.body,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
  return await registration.handler(request, context) as { status?: number; jsonBody?: T; body?: Buffer; headers?: Record<string, string> };
}

describe('Azure Functions endpoint smoke test', () => {
  beforeEach(async () => {
    clearServices();
    database = new MemoryDatabase();
    storedFiles = new Map();
    invitationUrl = '';
    const pdf = await PDFDocument.create();
    pdf.addPage();
    pdfBytes = Buffer.from(await pdf.save());
    const user: User = { ...currentUser, passwordHash: 'test-hash', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await database.create('users', user);
    const services: Services = {
      config: { environment: 'Development', databaseUrl: 'postgresql://test:test@localhost/test', azureStorageConnectionString: 'UseDevelopmentStorage=true', azureStorageAccount: undefined, jwtSecret: 'unit-test-secret-that-is-long-enough-123', jwtIssuer: 'signedoc-test', jwtAudience: 'signedoc-test', webOrigin: 'http://localhost:5173', maxUploadBytes: 10 * 1024 * 1024 },
      database: database as unknown as IDatabaseService,
      storage: {
        upload: async (container, name, data) => { storedFiles.set(`${container}/${name}`, Buffer.from(data)); },
        download: async (container, name) => { const data = storedFiles.get(`${container}/${name}`); if (!data) throw new Error('Missing test blob.'); return data; },
        createReadUrl: async (container, name) => `https://storage.test/${container}/${name}`,
        delete: async (container, name) => { storedFiles.delete(`${container}/${name}`); },
        healthCheck: async () => true,
      },
      auth: {
        register: async (input) => ({ user: { ...currentUser, displayName: input.name, email: input.email }, accessToken: bearerToken }),
        login: async () => ({ user: currentUser, accessToken: bearerToken }),
        authenticate: async (authorization) => authorization === `Bearer ${bearerToken}` ? currentUser : null,
        getUser: async (id) => id === currentUser.id ? user : null,
      },
      email: {
        sendInvitation: async (input) => { invitationUrl = input.signingUrl; return 'sent_to_development_sink'; },
        healthCheck: async () => true,
      },
    };
    registerServices(services);
  });

  it('registers and successfully exercises every HTTP endpoint through its Functions handler', async () => {
    expect([...registrations.routes.keys()].sort()).toEqual([
      'createDocument', 'createInvitation', 'currentUser', 'documentDetails', 'downloadDocument', 'health', 'listDocuments', 'login', 'openapi', 'register', 'resendInvitation', 'signingDocument', 'signingView', 'submitSignature', 'uploadDocumentContent',
    ]);

    expect((await call('health')).status).toBe(200);
    expect((await call('register', { method: 'POST', body: { name: 'Test Sender', email: 'sender@example.org', password: 'a-long-test-password' } })).status).toBe(201);
    expect((await call('login', { method: 'POST', body: { email: 'sender@example.org', password: 'a-long-test-password' } })).status).toBe(200);
    const authHeaders = { authorization: `Bearer ${bearerToken}` };
    expect((await call('currentUser', { headers: authHeaders })).status).toBe(200);
    expect((await call('listDocuments', { headers: authHeaders })).status).toBe(200);

    const created = await call<{ documentId: string }>('createDocument', { method: 'POST', headers: authHeaders, body: { fileName: 'smoke-test.pdf', contentType: 'application/pdf', size: pdfBytes.length } });
    expect(created.status).toBe(201);
    const documentId = created.jsonBody!.documentId;
    expect((await call('uploadDocumentContent', { method: 'PUT', params: { id: documentId }, headers: { ...authHeaders, 'content-type': 'application/pdf', 'content-length': String(pdfBytes.length) }, bytes: pdfBytes })).status).toBe(204);
    const invitation = await call<{ invitationId: string }>('createInvitation', { method: 'POST', params: { id: documentId }, headers: authHeaders, body: { name: 'Test Recipient', email: 'recipient@example.org' } });
    expect(invitation.status).toBe(201);
    const recipientId = invitation.jsonBody!.invitationId;
    const token = new URL(invitationUrl).pathname.split('/').at(-1)!;

    expect((await call('signingView', { params: { token } })).status).toBe(200);
    expect((await call('signingDocument', { params: { token } })).status).toBe(200);
    expect((await call('resendInvitation', { method: 'POST', params: { token }, body: { requestId: recipientId } })).status).toBe(200);
    expect((await call('downloadDocument', { params: { id: documentId }, query: { kind: 'original' }, headers: authHeaders })).status).toBe(200);
    expect((await call('submitSignature', { method: 'POST', params: { token }, body: { signature: 'Test Recipient', consent: true, requestId: recipientId } })).status).toBe(200);
    expect((await call('documentDetails', { params: { id: documentId }, headers: authHeaders })).status).toBe(200);
    expect((await call('downloadDocument', { params: { id: documentId }, query: { kind: 'completed' }, headers: authHeaders })).status).toBe(200);
    expect((await call('openapi')).status).toBe(200);

    const persistedDocument = await database.findById<DocumentRecord>('documents', documentId);
    const persistedRecipient = await database.findById<Recipient>('recipients', recipientId);
    const events = await database.findAll<AuditEvent>('auditEvents', { filter: { documentId } });
    expect(persistedDocument?.status).toBe('completed');
    expect(persistedRecipient?.status).toBe('completed');
    expect(events.map((event) => event.eventType)).toEqual(expect.arrayContaining(['invitation_sent', 'link_opened', 'invitation_resent', 'signature_submitted']));
  });
});