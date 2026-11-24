import type { AuditEvent, DocumentRecord, User } from '../../../shared/types/entities.js';
import { getServices } from '../services/registry.js';
import { getValidRecipient, registerHttp } from '../utils/http.js';

registerHttp('signingView', 'GET', 'sign/{token}', async (request) => {
  const token = request.params.token ?? ''; const recipient = await getValidRecipient(token); const services = getServices();
  const document = await services.database.findById<DocumentRecord>('documents', recipient.documentId);
  if (!document || !document.uploadedAt) throw new Error('The requested document is not available.');
  const sender = await services.database.findById<User>('users', document.ownerId);
  await services.database.create<AuditEvent>('auditEvents', { id: crypto.randomUUID(), documentId: document.id, recipientId: recipient.id, actor: recipient.name, eventType: 'link_opened', status: 'Viewed', createdAt: new Date().toISOString() });
  return { status: 200, jsonBody: { document: { id: document.id, fileName: document.fileName, contentType: document.contentType, size: document.size, status: document.status }, senderDisplayName: sender?.displayName ?? 'Document sender', recipient: { id: recipient.id, name: recipient.name, email: recipient.email }, expiresAt: recipient.expiresAt, previewUrl: `/api/sign/${encodeURIComponent(token)}/document` } };
});