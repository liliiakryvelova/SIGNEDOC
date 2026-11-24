import { registerSchema } from '../../../shared/schemas/validation.js';
import { validateBody } from '../middleware/validateRequest.js';
import { getServices } from '../services/registry.js';
import { rateLimit, registerHttp } from '../utils/http.js';

registerHttp('register', 'POST', 'auth/register', async (request) => {
  rateLimit(request, 'register', 4, 60 * 60_000);
  const input = await validateBody(request, registerSchema);
  const result = await getServices().auth.register(input);
  return { status: 201, jsonBody: result };
});