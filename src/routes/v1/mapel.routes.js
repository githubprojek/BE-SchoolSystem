import { Router } from 'express';
import { mapelController } from '../../controllers/mapel.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/authorize.js';

const router = Router();

router.post('/mapel', authenticate, authorize('admin'), asyncHandler(mapelController.create));
router.get('/mapel', authenticate, asyncHandler(mapelController.findAll));
router.get('/mapel/:id', authenticate, asyncHandler(mapelController.findById));
router.patch(
  '/mapel/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(mapelController.updateById),
);
router.delete(
  '/mapel/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(mapelController.deleteById),
);

export { router as mapelRoutes };
