import { loginSchema } from '../../../shared/schemas/validation.js';
import { validateBody } from '../middleware/validateRequest.js';
import { getServices } from '../services/registry.js';
import { rateLimit, registerHttp } from '../utils/http.js';

registerHttp('login', 'POST', 'auth/login', async (request) => { rateLimit(request, 'login', 8, 60_000); return { status: 200, jsonBody: await getServices().auth.login(await validateBody(request, loginSchema)) }; });