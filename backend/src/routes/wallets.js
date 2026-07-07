import express from 'express';
import { myWallet, platformWallets, requestWithdrawal, myWithdrawals } from '../controllers/walletsController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.get('/mine', requireAuth, myWallet);
router.get('/platform', requireAuth, requireAdmin, platformWallets);
router.post('/withdraw', requireAuth, requestWithdrawal);
router.get('/withdrawals/mine', requireAuth, myWithdrawals);
export default router;
