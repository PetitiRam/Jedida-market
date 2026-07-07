import express from 'express';
import { requestUpgrade, submitPayment, submitKyc, myUpgradeStatus } from '../controllers/upgradeController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/request', requireAuth, requestUpgrade);
router.post('/payment', requireAuth, submitPayment);
router.post('/kyc', requireAuth, submitKyc);
router.get('/status', requireAuth, myUpgradeStatus);

export default router;
