import type { AuthResponse, CreateDocumentResponse, CreateInvitationRequest, DocumentDetailsResponse, DocumentKind, CurrentUser, ListDocumentsResponse, RegisterRequest, ResendInvitationRequest, ResendInvitationResponse, SigningViewResponse, SubmitSignatureRequest, SubmitSignatureResponse } from '../types/index.js';

export interface ApiClient {
  register(input: RegisterRequest): Promise<AuthResponse>;
  login(input: { email: string; password: string }): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<CurrentUser>;
  listDocuments(status?: string): Promise<ListDocumentsResponse>;
  createDocument(input: { fileName: string; contentType: 'application/pdf'; size: number }): Promise<CreateDocumentResponse>;
  uploadDocument(documentId: string, file: File): Promise<void>;
  createInvitation(documentId: string, input: CreateInvitationRequest): Promise<{ invitationId: string; status: string }>;
  getSigningView(token: string): Promise<SigningViewResponse>;
  getSigningDocument(token: string): Promise<Blob>;
  submitSignature(token: string, input: SubmitSignatureRequest): Promise<SubmitSignatureResponse>;
  getDocument(id: string): Promise<DocumentDetailsResponse>;
  getDownloadUrl(id: string, kind: DocumentKind): Promise<string>;
  resendInvitation(token: string, input: ResendInvitationRequest): Promise<ResendInvitationResponse>;
}