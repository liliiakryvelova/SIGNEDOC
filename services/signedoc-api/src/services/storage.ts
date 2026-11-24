import { BlobServiceClient, BlobSASPermissions, StorageSharedKeyCredential, generateBlobSASQueryParameters } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import type { AppConfig } from './config.js';
import type { BlobClientProvider, IStorageService } from './interfaces/IStorageService.js';

export class AzuriteBlobClientProvider implements BlobClientProvider {
  constructor(private readonly connectionString: string) {}
  getConnection(): BlobServiceClient { return BlobServiceClient.fromConnectionString(this.connectionString); }
}

export class ManagedIdentityBlobClientProvider implements BlobClientProvider {
  constructor(private readonly account: string) {}
  getConnection(): BlobServiceClient { return new BlobServiceClient(`https://${this.account}.blob.core.windows.net`, new DefaultAzureCredential()); }
}

export class AzureBlobStorageService implements IStorageService {
  constructor(private readonly provider: BlobClientProvider, private readonly config: AppConfig) {}
  private async getContainer(name: string) { const container = this.provider.getConnection().getContainerClient(name); await container.createIfNotExists(); return container; }
  async upload(containerName: string, name: string, data: Buffer, contentType = 'application/octet-stream'): Promise<void> {
    const container = await this.getContainer(containerName);
    await container.getBlockBlobClient(name).uploadData(data, { blobHTTPHeaders: { blobContentType: contentType } });
  }
  async download(containerName: string, name: string): Promise<Buffer> {
    const blob = this.provider.getConnection().getContainerClient(containerName).getBlobClient(name);
    const response = await blob.download();
    if (!response.readableStreamBody) throw new Error('Blob download returned no content stream.');
    const chunks: Buffer[] = [];
    for await (const chunk of response.readableStreamBody) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return Buffer.concat(chunks);
  }
  async createReadUrl(containerName: string, name: string, expiresAt: Date): Promise<string> {
    const service = this.provider.getConnection(); const blob = service.getContainerClient(containerName).getBlobClient(name);
    if (this.config.environment === 'Development') {
      const accountName = /(?:^|;)AccountName=([^;]+)/i.exec(this.config.azureStorageConnectionString ?? '')?.[1];
      const accountKey = /(?:^|;)AccountKey=([^;]+)/i.exec(this.config.azureStorageConnectionString ?? '')?.[1];
      if (!accountName || !accountKey) throw new Error('Azurite connection string must include account credentials to create a private read URL.');
      const credential = new StorageSharedKeyCredential(accountName, accountKey);
      const sas = generateBlobSASQueryParameters({ containerName, blobName: name, permissions: BlobSASPermissions.parse('r'), expiresOn: expiresAt }, credential).toString();
      return `${blob.url}?${sas}`;
    }
    const delegationKey = await service.getUserDelegationKey(new Date(Date.now() - 60_000), expiresAt);
    const sas = generateBlobSASQueryParameters({ containerName, blobName: name, permissions: BlobSASPermissions.parse('r'), expiresOn: expiresAt }, delegationKey, this.config.azureStorageAccount!).toString();
    return `${blob.url}?${sas}`;
  }
  async delete(containerName: string, name: string): Promise<void> { await this.provider.getConnection().getContainerClient(containerName).deleteBlob(name); }
  async healthCheck(): Promise<boolean> { try { await this.provider.getConnection().getAccountInfo(); return true; } catch { return false; } }
}