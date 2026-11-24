import { AppError } from './AppError.js';

export class BadRequestError extends AppError { constructor(message: string) { super(400, 'BAD_REQUEST', message); } }
export class UnauthorizedError extends AppError { constructor(message = 'Authentication required.') { super(401, 'UNAUTHORIZED', message); } }
export class ForbiddenError extends AppError { constructor(message = 'You do not have access to this resource.') { super(403, 'FORBIDDEN', message); } }
export class NotFoundError extends AppError { constructor(message = 'The requested resource was not found.') { super(404, 'NOT_FOUND', message); } }
export class ConflictError extends AppError { constructor(message: string) { super(409, 'CONFLICT', message); } }
export class GoneError extends AppError { constructor(message: string) { super(410, 'GONE', message); } }
export class PayloadTooLargeError extends AppError { constructor() { super(413, 'PAYLOAD_TOO_LARGE', 'The uploaded file exceeds the 10 MB limit.'); } }
export class UnsupportedMediaTypeError extends AppError { constructor() { super(415, 'UNSUPPORTED_MEDIA_TYPE', 'Only PDF documents are supported.'); } }
export class RateLimitError extends AppError { constructor() { super(429, 'RATE_LIMITED', 'Too many requests. Please try again later.'); } }