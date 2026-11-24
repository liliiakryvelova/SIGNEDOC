import type { DocumentRecord, DocumentSummary, Recipient } from '../../../shared/types/entities.js';
import { documentListQuerySchema } from '../../../shared/schemas/validation.js';
import { validateQuery } from '../middleware/validateRequest.js';
import { getServices } from '../services/registry.js';
import { registerHttp, requireUser, toPublicRecipient } from '../utils/http.js';

registerHttp('listDocuments', 'GET', 'documents', async (request) => {
  const user = await requireUser(request); const query = validateQuery(request.query, documentListQuerySchema);
  const documents = await getServices().database.findAll<DocumentRecord>('documents', { filter: { ownerId: user.id }, orderBy: 'updatedAt', orderDirection: 'desc', limit: 500 });
  const filtered = query.status ? documents.filter((document) => document.status === query.status) : documents;
  const start = query.cursor ? Math.max(filtered.findIndex((document) => document.id === query.cursor) + 1, 0) : 0;
  const page = filtered.slice(start, start + 20);
  const items: DocumentSummary[] = await Promise.all(page.map(async (document) => {
    const recipients = await getServices().database.findAll<Recipient>('recipients', { filter: { documentId: document.id } });
    return { ...document, recipients: recipients.map(toPublicRecipient) };
  }));
  return { status: 200, jsonBody: { items, nextCursor: start + 20 < filtered.length && page.length ? page[page.length - 1].id : null } };
});