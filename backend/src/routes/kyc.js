import express from 'express';
import { submitKyc, myKycStatus } from '../controllers/kycController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/submit', requireAuth, submitKyc);
router.get('/status', requireAuth, myKycStatus);

export default router;
