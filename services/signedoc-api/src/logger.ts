import pino from 'pino';

export const logger = pino({ level: process.env.LOG_LEVEL ?? 'info', base: { application: 'signedoc-api' }, redact: ['req.headers.authorization', '*.token', '*.tokenHash', '*.password', '*.passwordHash'] });