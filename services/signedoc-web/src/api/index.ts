import type { ApiClient } from './types.js';
import { liveClient } from './liveClient.js';
export const api: ApiClient = liveClient;
export type { ApiClient } from './types.js';