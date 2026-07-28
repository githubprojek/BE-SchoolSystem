import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { requestId } from '../middlewares/request-id.js';
import { rateLimiter } from '../middlewares/rate-limit.js';
import { errorHandler } from '../middlewares/error-handler.js';
import { apiRoutes } from '../routes/index.js';
import { logger } from '../logging/logger.js';

const app = express();
app.set('json spaces', 2);
app.use(requestId);
app.use((req, _res, next) => {
  logger.info({ req: { id: req.id, method: req.method, url: req.url } }, 'Request started');
  next();
});
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(rateLimiter);
app.use('/api', apiRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found', details: null },
  });
});

app.use(errorHandler);

export { app };
