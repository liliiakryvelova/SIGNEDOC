import type { ErrorCode } from '../../../shared/types/api.js';

export class AppError extends Error {
  constructor(public readonly statusCode: number, public readonly code: ErrorCode, message: string, public readonly details: unknown = null) { super(message); this.name = 'AppError'; }
}