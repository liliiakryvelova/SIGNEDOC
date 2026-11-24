import type { AppConfig } from './config.js';
import { loadConfig } from './config.js';
import { PostgresDatabaseService } from './database.js';
import { AzureBlobStorageService, AzuriteBlobClientProvider, ManagedIdentityBlobClientProvider } from './storage.js';
import { DatabaseAuthService } from './auth.js';
import { DevelopmentEmailSink } from './email.js';
import type { IDatabaseService } from './interfaces/IDatabaseService.js';
import type { IStorageService } from './interfaces/IStorageService.js';
import type { IAuthService } from './interfaces/IAuthService.js';
import type { IEmailService } from './interfaces/IEmailService.js';

export interface Services { config: AppConfig; database: IDatabaseService; storage: IStorageService; auth: IAuthService; email: IEmailService }
let services: Services | null = null;

export function registerServices(registry: Services): void { services = registry; }
export function clearServices(): void { services = null; }
export function initializeServices(): Services {
  const config = loadConfig();
  const database = new PostgresDatabaseService(config);
  const blobProvider = config.environment === 'Development'
    ? new AzuriteBlobClientProvider(config.azureStorageConnectionString!)
    : new ManagedIdentityBlobClientProvider(config.azureStorageAccount!);
  let email: IEmailService;
  try { email = new DevelopmentEmailSink(config); } catch { email = { sendInvitation: async () => 'provider_not_configured', healthCheck: async () => false }; }
  services = { config, database, storage: new AzureBlobStorageService(blobProvider, config), auth: new DatabaseAuthService(database, config), email };
  return services;
}
export function getServices(): Services { return services ?? initializeServices(); }