export interface AppConfig {
  environment: string;
  databaseUrl: string;
  azureStorageConnectionString: string | undefined;
  azureStorageAccount: string | undefined;
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  webOrigin: string;
  maxUploadBytes: number;
}

export function requireSetting(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function loadConfig(): AppConfig {
  const environment = process.env.AZURE_FUNCTIONS_ENVIRONMENT ?? 'Production';
  const jwtSecret = requireSetting('JWT_SECRET');
  if (jwtSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');
  const databaseUrl = requireSetting('DATABASE_URL');
  if (!/^postgres(ql)?:\/\//.test(databaseUrl)) throw new Error('DATABASE_URL must be a PostgreSQL URL.');
  const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);
  if (!Number.isSafeInteger(maxUploadBytes) || maxUploadBytes < 1 || maxUploadBytes > 10 * 1024 * 1024) throw new Error('MAX_UPLOAD_BYTES must be between 1 byte and 10 MB.');
  return {
    environment, databaseUrl,
    azureStorageConnectionString: environment === 'Development' ? requireSetting('AZURE_STORAGE_CONNECTION_STRING') : undefined,
    azureStorageAccount: environment === 'Development' ? undefined : requireSetting('AZURE_STORAGE_ACCOUNT'),
    jwtSecret, jwtIssuer: process.env.JWT_ISSUER ?? 'signedoc', jwtAudience: process.env.JWT_AUDIENCE ?? 'signedoc-web',
    webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173', maxUploadBytes,
  };
}