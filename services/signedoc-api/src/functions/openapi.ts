import { registerHttp } from '../utils/http.js';

const specification = {
  openapi: '3.0.3', info: { title: 'SingEDoc API', version: '1.0.0', description: 'MVP signing workflow. This API does not guarantee legal enforceability or regulatory compliance.' }, servers: [{ url: '/api' }],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths: {
    '/health': { get: { summary: 'Service health', responses: { '200': { description: 'Healthy or degraded' }, '503': { description: 'Unhealthy' } } } },
    '/auth/register': { post: { summary: 'Create sender account', responses: { '201': { description: 'Account created' }, '409': { description: 'Email already registered' } } } },
    '/auth/login': { post: { summary: 'Sign in sender', responses: { '200': { description: 'Session created' }, '401': { description: 'Invalid credentials' } } } },
    '/auth/me': { get: { security: [{ bearerAuth: [] }], summary: 'Get current sender', responses: { '200': { description: 'Current user' }, '401': { description: 'Authentication required' } } } },
    '/documents': { get: { security: [{ bearerAuth: [] }], summary: 'List sender documents', responses: { '200': { description: 'Document list' } } }, post: { security: [{ bearerAuth: [] }], summary: 'Create a PDF upload request', responses: { '201': { description: 'Upload URL and document ID' } } } },
    '/documents/{id}/content': { put: { security: [{ bearerAuth: [] }], summary: 'Upload PDF content', responses: { '204': { description: 'Uploaded' } } } },
    '/documents/{id}/invitations': { post: { security: [{ bearerAuth: [] }], summary: 'Create recipient signing invitation', responses: { '201': { description: 'Invitation created' } } } },
    '/documents/{id}': { get: { security: [{ bearerAuth: [] }], summary: 'Document timeline', responses: { '200': { description: 'Document details' } } } },
    '/documents/{id}/download': { get: { security: [{ bearerAuth: [] }], summary: 'Create short-lived download URL', responses: { '200': { description: 'Download URL' } } } },
    '/sign/{token}': { get: { summary: 'Read signing request', responses: { '200': { description: 'Signing view' }, '410': { description: 'Invitation expired' } } }, post: { summary: 'Record recipient signature', responses: { '200': { description: 'Signature recorded' }, '409': { description: 'Already signed' } } } },
    '/sign/{token}/document': { get: { summary: 'Read invitation-scoped PDF preview', responses: { '200': { description: 'PDF content' } } } },
    '/sign/{token}/resend': { post: { summary: 'Resend an invitation through configured email sink', responses: { '200': { description: 'Invitation status' } } } },
  },
};
registerHttp('openapi', 'GET', 'openapi.json', async () => ({ status: 200, jsonBody: specification }));