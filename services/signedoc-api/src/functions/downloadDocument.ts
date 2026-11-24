import { documentIdParamsSchema, downloadQuerySchema } from '../../../shared/schemas/validation.js';
import type { DocumentKind } from '../../../shared/types/entities.js';
import { ConflictError, NotFoundError } from '../errors/errorTypes.js';
import { validateParams, validateQuery } from '../middleware/validateRequest.js';
import { getServices } from '../services/registry.js';
import { registerHttp, requireOwnedDocument, requireUser } from '../utils/http.js';

registerHttp('downloadDocument', 'GET', 'documents/{id}/download', async (request) => {
  const user = await requireUser(request); const { id } = validateParams(request.params, documentIdParamsSchema);
  const { kind } = validateQuery(request.query, downloadQuerySchema); const document = await requireOwnedDocument(id, user);
  const blobName = kind === 'original' ? document.originalBlobName : document.completedBlobName;
  if (!blobName) throw new ConflictError('A completed document is not available yet.');
  const downloadUrl = await getServices().storage.createReadUrl(kind === 'original' ? 'documents-original' : 'documents-completed', blobName, new Date(Date.now() + 5 * 60_000));
  if (!downloadUrl) throw new NotFoundError('Document file not found.');
  return { status: 200, jsonBody: { downloadUrl, expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(), kind: kind satisfies DocumentKind } };
});