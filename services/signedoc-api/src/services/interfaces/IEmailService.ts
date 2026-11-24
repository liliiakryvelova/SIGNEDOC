export interface IEmailService {
  sendInvitation(input: { to: string; recipientName: string; documentName: string; signingUrl: string; expiresAt: string }): Promise<'sent_to_development_sink' | 'provider_not_configured'>;
  healthCheck(): Promise<boolean>;
}