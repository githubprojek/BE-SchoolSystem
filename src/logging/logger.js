import pino from 'pino';
import { config } from '../config/index.js';

const defaultLevel = config.isProd ? 'info' : config.isTest ? 'silent' : 'debug';

export const logger = pino({
  level: config.logLevel ?? defaultLevel,
  redact: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
});
