import type { HttpRequest } from '@azure/functions';
import type { ZodType } from 'zod';
import { BadRequestError } from '../errors/errorTypes.js';

export async function validateBody<T>(request: HttpRequest, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try { body = await request.json(); } catch { throw new BadRequestError('Request body must be valid JSON.'); }
  return schema.parse(body);
}

export function validateParams<T>(params: unknown, schema: ZodType<T>): T { return schema.parse(params); }
export function validateQuery<T>(query: URLSearchParams, schema: ZodType<T>): T { return schema.parse(Object.fromEntries(query.entries())); }