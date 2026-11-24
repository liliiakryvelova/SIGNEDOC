import { getServices } from '../services/registry.js';
import { registerHttp } from '../utils/http.js';

registerHttp('health', 'GET', 'health', async () => {
  const services = getServices();
  const [database, storage] = await Promise.all([services.database.healthCheck(), services.storage.healthCheck()]);
  const status = database && storage ? 'healthy' : database || storage ? 'degraded' : 'unhealthy';
  return { status: status === 'unhealthy' ? 503 : 200, jsonBody: { status, services: { database, blobStorage: storage } } };
});