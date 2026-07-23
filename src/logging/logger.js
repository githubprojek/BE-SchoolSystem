import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.isProd ? 'info' : 'debug',
  redact: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
});
