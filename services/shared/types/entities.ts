export type DocumentStatus = 'draft' | 'awaiting_signature' | 'completed' | 'expired';
export type RecipientStatus = 'awaiting_signature' | 'completed' | 'expired';
export type DocumentKind = 'original' | 'completed';

export interface User {
  id: string;
  email: string;
  displayName: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRecord {
  id: string;
  ownerId: string;
  fileName: string;
  contentType: 'application/pdf';
  size: number;
  status: DocumentStatus;
  originalBlobName: string;
  completedBlobName: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  uploadedAt?: string | null;
}

export interface Recipient {
  id: string;
  documentId: string;
  name: string;
  email: string;
  message: string | null;
  status: RecipientStatus;
  tokenHash: string;
  expiresAt: string;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  documentId: string;
  recipientId: string | null;
  actor: string;
  eventType: 'request_created' | 'invitation_sent' | 'link_opened' | 'signature_submitted' | 'invitation_resent';
  status: string;
  createdAt: string;
}

export interface PublicRecipient {
  id: string;
  name: string;
  email: string;
  status: RecipientStatus;
  expiresAt: string;
  signedAt: string | null;
}

export interface CurrentUser { id: string; email: string; displayName: string }

export interface DocumentSummary extends DocumentRecord {
  recipients: PublicRecipient[];
}