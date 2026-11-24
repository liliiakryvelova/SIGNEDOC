import type { ApiClient } from './types.js';
import { demoDocuments, demoEvents, demoSigningView, demoUser } from '../mocks/data.js';
import { getPreviewState } from './previewState.js';
import type { DocumentDetailsResponse, DocumentSummary, PreviewDataState } from '../types/index.js';

const wait = (ms = 80) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const requireData = async (): Promise<PreviewDataState> => {
  const state = getPreviewState();
  if (state === 'loading') await wait(60_000);
  if (state === 'error') throw new Error('The preview data could not be loaded. Try again.');
  return state;
};
const documents = [...demoDocuments];
export const mockClient: ApiClient = {
  async register(input) { await wait(); return { accessToken: 'demo-session', user: { id: crypto.randomUUID(), displayName: input.name, email: input.email } }; },
  async login(input) { await wait(); if (!input.email || !input.password) throw new Error('Enter your email and password.'); return { accessToken: 'demo-session', user: demoUser }; },
  async logout() {},
  async getCurrentUser() { await wait(20); return demoUser; },
  async listDocuments(status) {
    const state = await requireData();
    const items = state === 'empty' ? [] : documents.filter((item) => !status || item.status === status);
    return { items, nextCursor: null };
  },
  async createDocument(input) {
    await wait();
    const id = crypto.randomUUID();
    const record: DocumentSummary = { id, ownerId: demoUser.id, fileName: input.fileName, contentType: input.contentType, size: input.size, status: 'draft', originalBlobName: id, completedBlobName: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), completedAt: null, recipients: [] };
    documents.unshift(record);
    return { documentId: id, uploadUrl: `/api/documents/${id}/content`, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString() };
  },
  async uploadDocument() { await wait(); },
  async createInvitation(documentId, input) {
    await wait();
    const doc = documents.find((item) => item.id === documentId);
    if (!doc) throw new Error('Document not found.');
    doc.status = 'awaiting_signature';
    doc.recipients.push({ id: crypto.randomUUID(), name: input.name, email: input.email, status: 'awaiting_signature', expiresAt: input.expiresAt ?? new Date(Date.now() + 7 * 86400_000).toISOString(), signedAt: null });
    return { invitationId: crypto.randomUUID(), status: 'sent_to_development_sink' };
  },
  async getSigningView() { await requireData(); return demoSigningView; },
  async getSigningDocument() { await requireData(); return new Blob(['Demo preview only — no source document is included.'], { type: 'application/pdf' }); },
  async submitSignature(_token, input) { await wait(); if (!input.consent) throw new Error('Consent is required.'); return { documentId: demoSigningView.document.id, status: 'completed', signedAt: new Date().toISOString() }; },
  async getDocument(id): Promise<DocumentDetailsResponse> {
    await requireData();
    const document = documents.find((item) => item.id === id);
    if (!document) throw new Error('Document not found.');
    return { document, recipients: document.recipients, events: demoEvents.filter((event) => event.documentId === id) };
  },
  async getDownloadUrl() { throw new Error('Mock preview records do not include document files. Upload a real PDF to test downloads.'); },
  async resendInvitation(_signToken, _input) { await wait(); return { status: 'sent_to_development_sink', sentAt: new Date().toISOString() }; },
};