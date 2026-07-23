import { Router } from 'express';
import { kelasController } from '../../controllers/kelas.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { authorize } from '../../middlewares/authorize.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.post('/kelas', authenticate, authorize('admin'), asyncHandler(kelasController.create));
router.get(
  '/kelas',
  authenticate,
  authorize('admin', 'guru'),
  asyncHandler(kelasController.findAll),
);

router.get(
  '/kelas/:id',
  authenticate,
  authorize('admin', 'guru'),
  asyncHandler(kelasController.findById),
);
router.patch(
  '/kelas/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(kelasController.updateById),
);
router.delete(
  '/kelas/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(kelasController.deleteById),
);

export { router as kelasRoutes };
