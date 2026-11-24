import { describe, expect, it } from 'vitest';
import { createDocumentSchema, invitationSchema, registerSchema, signatureSchema } from './validation.js';

describe('request validation', () => {
  it('normalizes email and requires a strong account password', () => {
    expect(registerSchema.safeParse({ name: 'Sam', email: 'SAM@EXAMPLE.ORG', password: 'a-very-long-password' }).data?.email).toBe('sam@example.org');
    expect(registerSchema.safeParse({ name: 'Sam', email: 'sam@example.org', password: 'short' }).success).toBe(false);
  });
  it('accepts only bounded PDF uploads', () => {
    expect(createDocumentSchema.safeParse({ fileName: 'agreement.pdf', contentType: 'application/pdf', size: 1024 }).success).toBe(true);
    expect(createDocumentSchema.safeParse({ fileName: 'agreement.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1024 }).success).toBe(false);
  });
  it('validates recipient invitation and explicit electronic-signing consent', () => {
    expect(invitationSchema.safeParse({ name: 'Alex', email: 'alex@example.org' }).success).toBe(true);
    expect(signatureSchema.safeParse({ signature: 'Alex Rivera', consent: false, requestId: '00000000-0000-4000-8000-000000000000' }).success).toBe(false);
  });
});