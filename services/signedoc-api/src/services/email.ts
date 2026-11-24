import { logger } from '../logger.js';
import type { AppConfig } from './config.js';
import type { IEmailService } from './interfaces/IEmailService.js';

export class DevelopmentEmailSink implements IEmailService {
  constructor(private readonly config: AppConfig) {}
  async sendInvitation(input: { to: string; recipientName: string; documentName: string; signingUrl: string; expiresAt: string }): Promise<'sent_to_development_sink' | 'provider_not_configured'> {
    if (this.config.environment !== 'Development') return 'provider_not_configured';
    logger.info({ to: input.to, recipientName: input.recipientName, documentName: input.documentName, expiresAt: input.expiresAt, signingUrl: input.signingUrl }, 'Development email sink: signing invitation (no email sent)');
    return 'sent_to_development_sink';
  }
  async healthCheck(): Promise<boolean> { return true; }
}