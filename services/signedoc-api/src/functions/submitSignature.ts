import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { AuditEvent, DocumentRecord, Recipient } from '../../../shared/types/entities.js';
import { signatureSchema } from '../../../shared/schemas/validation.js';
import { ConflictError, NotFoundError } from '../errors/errorTypes.js';
import { validateBody } from '../middleware/validateRequest.js';
import { getServices } from '../services/registry.js';
import { getValidRecipient, newId, rateLimit, registerHttp } from '../utils/http.js';

registerHttp('submitSignature', 'POST', 'sign/{token}', async (request) => {
  rateLimit(request, 'sign', 10, 60_000);
  const token = request.params.token ?? ''; const recipient = await getValidRecipient(token);
  const input = await validateBody(request, signatureSchema);
  if (input.requestId !== recipient.id) throw new ConflictError('This signing request does not match the recipient link.');
  const services = getServices(); const document = await services.database.findById<DocumentRecord>('documents', recipient.documentId);
  if (!document?.uploadedAt) throw new NotFoundError('Document file not found.');
  if (document.status === 'completed') throw new ConflictError('This document has already been completed.');
  const original = await services.storage.download('documents-original', document.originalBlobName);
  const pdf = await PDFDocument.load(original); const page = pdf.getPages().at(-1);
  if (!page) throw new Error('The PDF has no pages.');
  const font = await pdf.embedFont(StandardFonts.Helvetica); const signedAt = new Date().toISOString();
  const { width } = page.getSize();
  page.drawText(`Electronically signed by: ${input.signature}`, { x: 52, y: 58, size: 12, font, color: rgb(0.09, 0.29, 0.49), maxWidth: width - 104 });
  page.drawText(`Recorded by SingEDoc on ${signedAt}. This typed signature is not a legal-compliance certification.`, { x: 52, y: 40, size: 7, font, color: rgb(0.35, 0.42, 0.49), maxWidth: width - 104 });
  const completedBytes = Buffer.from(await pdf.save()); const completedBlobName = `${document.ownerId}/${document.id}/completed.pdf`;
  await services.storage.upload('documents-completed', completedBlobName, completedBytes, 'application/pdf');
  const updatedRecipient: Partial<Recipient> = { status: 'completed', signedAt, updatedAt: signedAt };
  const updatedDocument: Partial<DocumentRecord> = { status: 'completed', completedBlobName, completedAt: signedAt, updatedAt: signedAt };
  const event: AuditEvent = { id: newId(), documentId: document.id, recipientId: recipient.id, actor: recipient.name, eventType: 'signature_submitted', status: 'Completed', createdAt: signedAt };
  try {
    await services.database.transaction(async (transaction) => {
      await transaction.update('recipients', recipient.id, updatedRecipient);
      await transaction.update('documents', document.id, updatedDocument);
      await transaction.create('auditEvents', event);
    });
  } catch (error) { await services.storage.delete('documents-completed', completedBlobName).catch(() => undefined); throw error; }
  return { status: 200, jsonBody: { documentId: document.id, status: 'completed', signedAt } };
});