import { createDocumentSchema } from '../../../shared/schemas/validation.js';
import type { DocumentRecord } from '../../../shared/types/entities.js';
import { validateBody } from '../middleware/validateRequest.js';
import { getServices } from '../services/registry.js';
import { newId, requireUser } from '../utils/http.js';
import { registerHttp } from '../utils/http.js';

registerHttp('createDocument', 'POST', 'documents', async (request) => {
  const user = await requireUser(request); const input = await validateBody(request, createDocumentSchema);
  const now = new Date().toISOString(); const id = newId();
  const safeName = input.fileName.replace(/[\\/\u0000-\u001f]/g, '_');
  const document: DocumentRecord = { id, ownerId: user.id, fileName: safeName, contentType: 'application/pdf', size: input.size, status: 'draft', originalBlobName: `${user.id}/${id}/original.pdf`, completedBlobName: null, createdAt: now, updatedAt: now, completedAt: null, uploadedAt: null };
  await getServices().database.create('documents', document);
  return { status: 201, jsonBody: { documentId: id, uploadUrl: `/api/documents/${id}/content`, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString() } };
});