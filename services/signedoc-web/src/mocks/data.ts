import type { AuditEvent, CurrentUser, DocumentSummary, SigningViewResponse } from '../types/index.js';

export const demoUser: CurrentUser = { id: '00000000-0000-4000-8000-000000000001', displayName: 'SingEDoc Team', email: 'team@signedoc.local' };

export const demoDocuments: DocumentSummary[] = [
  { id: '11111111-1111-4111-8111-111111111111', ownerId: demoUser.id, fileName: 'Community Partnership Agreement', contentType: 'application/pdf', size: 143360, status: 'awaiting_signature', originalBlobName: 'demo/community-partnership.pdf', completedBlobName: null, createdAt: '2026-11-20T09:00:00.000Z', updatedAt: '2026-11-22T14:30:00.000Z', completedAt: null, recipients: [{ id: '22222222-2222-4222-8222-222222222222', name: 'Maya Chen', email: 'maya@example.org', status: 'awaiting_signature', expiresAt: '2026-11-30T23:59:00.000Z', signedAt: null }] },
  { id: '33333333-3333-4333-8333-333333333333', ownerId: demoUser.id, fileName: 'Volunteer Handbook Acknowledgment', contentType: 'application/pdf', size: 286720, status: 'completed', originalBlobName: 'demo/handbook.pdf', completedBlobName: 'demo/handbook-completed.pdf', createdAt: '2026-11-20T09:00:00.000Z', updatedAt: '2026-11-21T16:20:00.000Z', completedAt: '2026-11-21T16:20:00.000Z', recipients: [{ id: '44444444-4444-4444-8444-444444444444', name: 'Jordan Lee', email: 'jordan@example.org', status: 'completed', expiresAt: '2026-11-30T23:59:00.000Z', signedAt: '2026-11-21T16:20:00.000Z' }] },
  { id: '55555555-5555-4555-8555-555555555555', ownerId: demoUser.id, fileName: 'Board Meeting Confidentiality Form', contentType: 'application/pdf', size: 81920, status: 'draft', originalBlobName: 'demo/board-form.pdf', completedBlobName: null, createdAt: '2026-11-20T09:00:00.000Z', updatedAt: '2026-11-20T09:00:00.000Z', completedAt: null, recipients: [{ id: '66666666-6666-4666-8666-666666666666', name: 'Alex Rivera', email: 'alex@example.org', status: 'awaiting_signature', expiresAt: '2026-11-30T23:59:00.000Z', signedAt: null }] },
];

export const demoEvents: AuditEvent[] = [
  { id: '77777777-7777-4777-8777-777777777777', documentId: demoDocuments[1].id, recipientId: null, actor: 'SingEDoc Team', eventType: 'request_created', status: 'Sent', createdAt: '2026-11-20T09:00:00.000Z' },
  { id: '88888888-8888-4888-8888-888888888888', documentId: demoDocuments[1].id, recipientId: demoDocuments[1].recipients[0].id, actor: 'Jordan Lee', eventType: 'link_opened', status: 'Viewed', createdAt: '2026-11-21T15:40:00.000Z' },
  { id: '99999999-9999-4999-8999-999999999999', documentId: demoDocuments[1].id, recipientId: demoDocuments[1].recipients[0].id, actor: 'Jordan Lee', eventType: 'signature_submitted', status: 'Completed', createdAt: '2026-11-21T16:20:00.000Z' },
];

export const demoSigningView: SigningViewResponse = {
  document: { id: demoDocuments[0].id, fileName: demoDocuments[0].fileName, contentType: 'application/pdf', size: demoDocuments[0].size, status: 'awaiting_signature' },
  senderDisplayName: 'SingEDoc Team', recipient: { id: '22222222-2222-4222-8222-222222222222', name: 'Maya Chen', email: 'maya@example.org' }, expiresAt: '2026-11-30T23:59:00.000Z', previewUrl: '#demo-document-preview',
};