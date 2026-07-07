import express from 'express';
import * as ctrl from '../controllers/settingsCenterController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/all', ctrl.getAllSettings);
router.patch('/identity', ctrl.updateIdentity);
router.patch('/branding', ctrl.updateBranding);

router.get('/section/:section', ctrl.getSection);
router.patch('/section/:section', ctrl.updateSection);

router.get('/audit-log', ctrl.getAuditLog);

router.get('/legal', ctrl.listLegalDocuments);
router.get('/legal/:docType', ctrl.getLegalDocument);
router.put('/legal/:docType', ctrl.updateLegalDocument);

router.get('/system-info', ctrl.getSystemInfo);

router.post('/backup', ctrl.createBackup);
router.get('/backups', ctrl.listBackups);
router.post('/restore', ctrl.restoreBackup);

export default router;
