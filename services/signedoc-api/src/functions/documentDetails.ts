import type { AuditEvent, Recipient } from '../../../shared/types/entities.js';
import { documentIdParamsSchema } from '../../../shared/schemas/validation.js';
import { validateParams } from '../middleware/validateRequest.js';
import { getServices } from '../services/registry.js';
import { registerHttp, requireOwnedDocument, requireUser, toPublicRecipient } from '../utils/http.js';

registerHttp('documentDetails', 'GET', 'documents/{id}', async (request) => {
  const user = await requireUser(request); const { id } = validateParams(request.params, documentIdParamsSchema);
  const document = await requireOwnedDocument(id, user); const database = getServices().database;
  const [recipients, events] = await Promise.all([database.findAll<Recipient>('recipients', { filter: { documentId: id }, orderBy: 'createdAt' }), database.findAll<AuditEvent>('auditEvents', { filter: { documentId: id }, orderBy: 'createdAt' })]);
  return { status: 200, jsonBody: { document, recipients: recipients.map(toPublicRecipient), events } };
});