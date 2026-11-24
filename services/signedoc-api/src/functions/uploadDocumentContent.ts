import { PayloadTooLargeError, UnsupportedMediaTypeError, ConflictError } from '../errors/errorTypes.js';
import { getServices } from '../services/registry.js';
import { validateParams } from '../middleware/validateRequest.js';
import { documentIdParamsSchema } from '../../../shared/schemas/validation.js';
import { registerHttp, requireOwnedDocument, requireUser } from '../utils/http.js';

registerHttp('uploadDocumentContent', 'PUT', 'documents/{id}/content', async (request) => {
  const user = await requireUser(request); const { id } = validateParams(request.params, documentIdParamsSchema);
  const document = await requireOwnedDocument(id, user);
  if (document.status !== 'draft') throw new ConflictError('Only draft documents can receive an upload.');
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/pdf') throw new UnsupportedMediaTypeError();
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > getServices().config.maxUploadBytes || document.size > getServices().config.maxUploadBytes) throw new PayloadTooLargeError();
  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length > getServices().config.maxUploadBytes) throw new PayloadTooLargeError();
  if (bytes.length !== document.size || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') throw new UnsupportedMediaTypeError();
  const services = getServices();
  await services.storage.upload('documents-original', document.originalBlobName, bytes, 'application/pdf');
  await services.database.update('documents', id, { updatedAt: new Date().toISOString(), uploadedAt: new Date().toISOString() });
  return { status: 204 };
});