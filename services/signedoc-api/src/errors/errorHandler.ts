import type { HttpResponseInit, InvocationContext } from '@azure/functions';
import { ZodError } from 'zod';
import type { ErrorCode } from '../../../shared/types/api.js';
import { AppError } from './AppError.js';

export function handleError(error: unknown, context: InvocationContext): HttpResponseInit {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
    return { status: 409, jsonBody: { error: { code: 'CONFLICT', message: 'A record with this value already exists.', details: null } } };
  }
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23503') {
    return { status: 400, jsonBody: { error: { code: 'BAD_REQUEST', message: 'A referenced record does not exist.', details: null } } };
  }
  if (error instanceof AppError) {
    context.warn(error.message);
    return { status: error.statusCode, jsonBody: { error: { code: error.code, message: error.message, details: error.details } } };
  }
  if (error instanceof ZodError) {
    return { status: 422, jsonBody: { error: { code: 'VALIDATION_ERROR' satisfies ErrorCode, message: 'Request validation failed.', details: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })) } } };
  }
  const err = error instanceof Error ? error : new Error(String(error));
  context.error('Unhandled API error', err);
  return { status: 500, jsonBody: { error: { code: 'INTERNAL_ERROR' satisfies ErrorCode, message: process.env.NODE_ENV === 'production' ? 'An internal error occurred.' : err.message, details: null } } };
}