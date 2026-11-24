import type { DocumentRecord } from '../../../shared/types/entities.js';
import { NotFoundError } from '../errors/errorTypes.js';
import { getServices } from '../services/registry.js';
import { getValidRecipient, registerHttp } from '../utils/http.js';

registerHttp('signingDocument', 'GET', 'sign/{token}/document', async (request) => {
  const recipient = await getValidRecipient(request.params.token ?? '');
  const document = await getServices().database.findById<DocumentRecord>('documents', recipient.documentId);
  if (!document?.uploadedAt) throw new NotFoundError('Document file not found.');
  const file = await getServices().storage.download('documents-original', document.originalBlobName);
  return { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }, body: file };
});