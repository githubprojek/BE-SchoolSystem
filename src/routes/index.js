import { Router } from 'express';
import { mapelRoutes } from './v1/mapel.routes.js';
import { healthRoutes } from './v1/health.routes.js';
import { usersRoutes } from './v1/users.routes.js';
import { kelasRoutes } from './v1/kelas.routes.js';
import { jadwalRoutes } from './v1/jadwal.routes.js';
import { nilaiRoutes } from './v1/nilai.routes.js';
import { absensiRoutes } from './v1/absensi.routes.js';
const router = Router();

router.use('/v1', healthRoutes);
router.use('/v1', usersRoutes);
router.use('/v1', mapelRoutes);
router.use('/v1', kelasRoutes);
router.use('/v1', jadwalRoutes);
router.use('/v1', nilaiRoutes);
router.use('/v1', absensiRoutes);
export { router as apiRoutes };
