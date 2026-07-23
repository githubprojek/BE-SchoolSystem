import { absensiController } from '../../controllers/absensi.controller.js';
import Router from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/authorize.js';

const router = Router();

router.get('/absen', authenticate, asyncHandler(absensiController.findAll));
router.get('/absen/:id', authenticate, asyncHandler(absensiController.findById));
router.post(
  '/absen',
  authenticate,
  authorize('admin', 'guru'),
  asyncHandler(absensiController.create),
);
router.patch(
  '/absen/:id',
  authenticate,
  authorize('admin', 'guru'),
  asyncHandler(absensiController.updateById),
);
router.delete(
  '/absen/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(absensiController.deleteById),
);

export { router as absensiRoutes };
