export interface IStorageService {
  upload(container: string, name: string, data: Buffer, contentType?: string): Promise<void>;
  download(container: string, name: string): Promise<Buffer>;
  createReadUrl(container: string, name: string, expiresAt: Date): Promise<string>;
  delete(container: string, name: string): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface BlobClientProvider { getConnection(): import('@azure/storage-blob').BlobServiceClient }