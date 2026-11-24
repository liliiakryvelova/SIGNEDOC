import type { AuditEvent, CurrentUser, DocumentKind, DocumentRecord, DocumentSummary, PublicRecipient } from './entities.js';

export type ErrorCode = 'VALIDATION_ERROR' | 'BAD_REQUEST' | 'NOT_FOUND' | 'CONFLICT' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'GONE' | 'PAYLOAD_TOO_LARGE' | 'UNSUPPORTED_MEDIA_TYPE' | 'RATE_LIMITED' | 'INTERNAL_ERROR';
export interface ErrorResponse { error: { code: ErrorCode; message: string; details: unknown | null } }
export interface HealthResponse { status: 'healthy' | 'degraded' | 'unhealthy'; services: Record<string, boolean> }
export interface RegisterRequest { name: string; email: string; password: string }
export interface LoginRequest { email: string; password: string }
export interface AuthResponse { accessToken: string; user: CurrentUser }
export interface CurrentUserResponse { user: CurrentUser }
export interface ListDocumentsResponse { items: DocumentSummary[]; nextCursor: string | null }
export interface CreateDocumentResponse { documentId: string; uploadUrl: string; expiresAt: string }
export interface CreateInvitationRequest { name: string; email: string; message?: string; expiresAt?: string }
export interface CreateInvitationResponse { invitationId: string; status: string }
export interface SigningViewResponse { document: Pick<DocumentRecord, 'id' | 'fileName' | 'contentType' | 'size' | 'status'>; senderDisplayName: string; recipient: Pick<PublicRecipient, 'id' | 'name' | 'email'>; expiresAt: string; previewUrl: string }
export interface SubmitSignatureRequest { signature: string; consent: boolean; requestId: string }
export interface SubmitSignatureResponse { documentId: string; status: string; signedAt: string }
export interface DocumentDetailsResponse { document: DocumentRecord; recipients: PublicRecipient[]; events: AuditEvent[] }
export interface DownloadResponse { downloadUrl: string; expiresAt: string }
export interface ResendInvitationRequest { requestId: string }
export interface ResendInvitationResponse { status: string; sentAt: string }
export type { DocumentKind };