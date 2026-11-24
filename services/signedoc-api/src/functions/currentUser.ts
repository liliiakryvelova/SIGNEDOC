import { registerHttp, requireUser } from '../utils/http.js';

registerHttp('currentUser', 'GET', 'auth/me', async (request) => ({ status: 200, jsonBody: { user: await requireUser(request) } }));