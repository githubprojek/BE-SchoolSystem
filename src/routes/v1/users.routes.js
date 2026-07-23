import { Router } from 'express';
import { usersController } from '../../controllers/users.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/authorize.js';

const router = Router();

router.post('/register', asyncHandler(usersController.register));
router.post('/login', asyncHandler(usersController.login));
router.get(
  '/users',
  authenticate,
  authorize('admin', 'guru'),
  asyncHandler(usersController.findAll),
);
router.get('/me', authenticate, asyncHandler(usersController.getProfile));
router.patch('/me', authenticate, asyncHandler(usersController.updateProfile));
router.delete(
  '/me',
  authenticate,
  authorize('admin', 'guru'),
  asyncHandler(usersController.deleteProfile),
);

export { router as usersRoutes };
