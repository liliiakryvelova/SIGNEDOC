import { documentIdParamsSchema, invitationSchema } from '../../../shared/schemas/validation.js';
import type { AuditEvent, Recipient } from '../../../shared/types/entities.js';
import { ConflictError } from '../errors/errorTypes.js';
import { validateBody, validateParams } from '../middleware/validateRequest.js';
import { getServices } from '../services/registry.js';
import { newId, newSigningToken, registerHttp, requireOwnedDocument, requireUser } from '../utils/http.js';

registerHttp('createInvitation', 'POST', 'documents/{id}/invitations', async (request) => {
  const user = await requireUser(request); const { id } = validateParams(request.params, documentIdParamsSchema);
  const input = await validateBody(request, invitationSchema); const document = await requireOwnedDocument(id, user);
  if (!document.uploadedAt) throw new ConflictError('Upload the PDF before inviting a recipient.');
  if (document.status !== 'draft') throw new ConflictError('A signing invitation has already been created for this document.');
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : new Date(Date.now() + 7 * 86400_000);
  if (expiresAt.getTime() <= Date.now() || expiresAt.getTime() > Date.now() + 30 * 86400_000) throw new ConflictError('The expiration date must be within the next 30 days.');
  const now = new Date().toISOString(); const token = newSigningToken(); const services = getServices();
  const recipient: Recipient = { id: newId(), documentId: id, name: input.name, email: input.email, message: input.message ?? null, status: 'awaiting_signature', tokenHash: (await import('node:crypto')).createHash('sha256').update(token).digest('hex'), expiresAt: expiresAt.toISOString(), signedAt: null, createdAt: now, updatedAt: now };
  const event: AuditEvent = { id: newId(), documentId: id, recipientId: recipient.id, actor: user.displayName, eventType: 'invitation_sent', status: 'Sent', createdAt: now };
  await services.database.transaction(async (transaction) => {
    await transaction.create('recipients', recipient);
    await transaction.create('auditEvents', event);
    await transaction.update('documents', id, { status: 'awaiting_signature', updatedAt: now });
  });
  let emailStatus: 'sent_to_development_sink' | 'provider_not_configured' = 'provider_not_configured';
  try { emailStatus = await services.email.sendInvitation({ to: recipient.email, recipientName: recipient.name, documentName: document.fileName, signingUrl: `${services.config.webOrigin}/sign/${token}`, expiresAt: recipient.expiresAt }); } catch { /* Email is an Enhancement; a local development sink is the only configured provider. */ }
  return { status: 201, jsonBody: { invitationId: recipient.id, status: emailStatus } };
});