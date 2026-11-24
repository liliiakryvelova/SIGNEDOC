export type { AuditEvent, CurrentUser, DocumentRecord, DocumentStatus, DocumentSummary, PublicRecipient, RecipientStatus } from '@signedoc/shared/types';
export type { AuthResponse, CreateDocumentResponse, CreateInvitationRequest, DocumentDetailsResponse, DocumentKind, HealthResponse, ListDocumentsResponse, RegisterRequest, ResendInvitationRequest, ResendInvitationResponse, SigningViewResponse, SubmitSignatureRequest, SubmitSignatureResponse } from '@signedoc/shared/types';

export type PreviewDataState = 'data' | 'loading' | 'empty' | 'error';