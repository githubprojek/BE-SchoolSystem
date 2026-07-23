import { Router } from 'express';
import { jadwalController } from '../../controllers/jadwal.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/authorize.js';

const router = Router();
router.get('/jadwal', authenticate, asyncHandler(jadwalController.findAll));
router.post('/jadwal', authenticate, authorize('admin'), asyncHandler(jadwalController.create));
router.get('/jadwal-saya', authenticate, asyncHandler(jadwalController.getMySchedule));
router.get('/jadwal/:id', authenticate, asyncHandler(jadwalController.findById));
router.patch(
  '/jadwal/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(jadwalController.updateById),
);
router.delete(
  '/jadwal/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(jadwalController.deleteById),
);

export { router as jadwalRoutes };
