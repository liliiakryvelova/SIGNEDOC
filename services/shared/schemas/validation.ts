import { z } from 'zod';

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
export const uuidSchema = z.string().uuid();
export const documentIdParamsSchema = z.object({ id: uuidSchema });
export const signingTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const registerSchema = z.object({ name: z.string().trim().min(1).max(100), email, password: z.string().min(12).max(128) }).strict();
export const loginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
export const createDocumentSchema = z.object({ fileName: z.string().trim().min(1).max(255), contentType: z.literal('application/pdf'), size: z.number().int().positive().max(10 * 1024 * 1024) }).strict();
export const invitationSchema = z.object({ name: z.string().trim().min(1).max(100), email, message: z.string().trim().max(1000).optional(), expiresAt: z.string().datetime().optional() }).strict();
export const signatureSchema = z.object({ signature: z.string().trim().min(1).max(120), consent: z.literal(true), requestId: z.string().uuid() }).strict();
export const resendSchema = z.object({ requestId: z.string().uuid() }).strict();
export const documentListQuerySchema = z.object({ status: z.enum(['draft', 'awaiting_signature', 'completed', 'expired']).optional(), cursor: z.string().uuid().optional() });
export const downloadQuerySchema = z.object({ kind: z.enum(['original', 'completed']) });

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type CreateDocumentRequest = z.infer<typeof createDocumentSchema>;
export type CreateInvitationRequest = z.infer<typeof invitationSchema>;
export type SubmitSignatureRequest = z.infer<typeof signatureSchema>;
export type ResendInvitationRequest = z.infer<typeof resendSchema>;