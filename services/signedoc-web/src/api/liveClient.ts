import type { ApiClient } from './types.js';
import type { AuthResponse, CreateDocumentResponse, CreateInvitationRequest, DocumentDetailsResponse, DocumentKind, ListDocumentsResponse, RegisterRequest, ResendInvitationRequest, ResendInvitationResponse, SigningViewResponse, SubmitSignatureRequest, SubmitSignatureResponse } from '../types/index.js';

const TOKEN_KEY = 'signedoc-access-token';
let accessToken: string | null = null;
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = accessToken ?? window.sessionStorage.getItem(TOKEN_KEY);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof Blob) && typeof init.body !== 'string') headers.set('Content-Type', 'application/json');
  const response = await fetch(`/api${path}`, { ...init, headers });
  if (!response.ok) {
    let message = 'Request failed.';
    try { message = ((await response.json()) as { error?: { message?: string } }).error?.message ?? message; } catch { /* Preserve a useful message for non-JSON proxy errors. */ }
    throw new Error(message);
  }
  return response.status === 204 ? undefined as T : await response.json() as T;
}

export const liveClient: ApiClient = {
  async register(input: RegisterRequest): Promise<AuthResponse> { const result = await request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) }); accessToken = result.accessToken; window.sessionStorage.setItem(TOKEN_KEY, accessToken); return result; },
  async login(input) { const result = await request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) }); accessToken = result.accessToken; window.sessionStorage.setItem(TOKEN_KEY, accessToken); return result; },
  async logout() { accessToken = null; window.sessionStorage.removeItem(TOKEN_KEY); },
  async getCurrentUser() { return (await request<{ user: AuthResponse['user'] }>('/auth/me')).user; },
  listDocuments(status?: string): Promise<ListDocumentsResponse> { return request(`/documents${status ? `?status=${encodeURIComponent(status)}` : ''}`); },
  createDocument(input): Promise<CreateDocumentResponse> { return request('/documents', { method: 'POST', body: JSON.stringify(input) }); },
  async uploadDocument(id: string, file: File): Promise<void> { await request(`/documents/${id}/content`, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file }); },
  createInvitation(id: string, input: CreateInvitationRequest) { return request(`/documents/${id}/invitations`, { method: 'POST', body: JSON.stringify(input) }); },
  getSigningView(token: string): Promise<SigningViewResponse> { return request(`/sign/${encodeURIComponent(token)}`); },
  async getSigningDocument(token: string): Promise<Blob> { const response = await fetch(`/api/sign/${encodeURIComponent(token)}/document`); if (!response.ok) throw new Error('Document preview is unavailable.'); return response.blob(); },
  submitSignature(token: string, input: SubmitSignatureRequest): Promise<SubmitSignatureResponse> { return request(`/sign/${encodeURIComponent(token)}`, { method: 'POST', body: JSON.stringify(input) }); },
  getDocument(id: string): Promise<DocumentDetailsResponse> { return request(`/documents/${encodeURIComponent(id)}`); },
  async getDownloadUrl(id: string, kind: DocumentKind): Promise<string> { const result = await request<{ downloadUrl: string }>(`/documents/${encodeURIComponent(id)}/download?kind=${kind}`); return result.downloadUrl; },
  resendInvitation(token: string, input: ResendInvitationRequest): Promise<ResendInvitationResponse> { return request(`/sign/${encodeURIComponent(token)}/resend`, { method: 'POST', body: JSON.stringify(input) }); },
};