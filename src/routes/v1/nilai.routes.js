import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authorize } from '../../middlewares/authorize.js';
import { authenticate } from '../../middlewares/auth.js';
import { nilaiController } from '../../controllers/nilai.controller.js';

const router = Router();

router.post(
  '/nilai',
  authenticate,
  authorize('admin', 'guru'),
  asyncHandler(nilaiController.create),
);
router.get('/nilai', authenticate, asyncHandler(nilaiController.findAll));
router.get('/nilai/:id', authenticate, asyncHandler(nilaiController.findById));
router.patch(
  '/nilai/:id',
  authenticate,
  authorize('admin', 'guru'),
  asyncHandler(nilaiController.updateById),
);
router.delete(
  '/nilai/:id',
  authenticate,
  authorize('admin', 'guru'),
  asyncHandler(nilaiController.deleteById),
);

export { router as nilaiRoutes };
