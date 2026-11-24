import type { DocumentRecord } from '../../../shared/types/entities.js';
import { resendSchema } from '../../../shared/schemas/validation.js';
import { ConflictError, NotFoundError } from '../errors/errorTypes.js';
import { validateBody } from '../middleware/validateRequest.js';
import { getServices } from '../services/registry.js';
import { getValidRecipient, newId, rateLimit, registerHttp } from '../utils/http.js';

registerHttp('resendInvitation', 'POST', 'sign/{token}/resend', async (request) => {
  rateLimit(request, 'resend', 4, 60 * 60_000);
  const token = request.params.token ?? ''; const recipient = await getValidRecipient(token); const input = await validateBody(request, resendSchema);
  if (input.requestId !== recipient.id) throw new ConflictError('This signing request does not match the recipient link.');
  const services = getServices(); const document = await services.database.findById<DocumentRecord>('documents', recipient.documentId);
  if (!document) throw new NotFoundError('Document not found.');
  const sentAt = new Date().toISOString();
  let status = 'provider_not_configured';
  try { status = await services.email.sendInvitation({ to: recipient.email, recipientName: recipient.name, documentName: document.fileName, signingUrl: `${services.config.webOrigin}/sign/${token}`, expiresAt: recipient.expiresAt }); } catch { /* Enhancement provider failures do not invalidate the invitation. */ }
  await services.database.create('auditEvents', { id: newId(), documentId: document.id, recipientId: recipient.id, actor: 'Document sender', eventType: 'invitation_resent', status, createdAt: sentAt });
  return { status: 200, jsonBody: { status, sentAt } };
});