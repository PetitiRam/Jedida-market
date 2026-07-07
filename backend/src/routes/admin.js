import express from 'express';
// add forceLogoutAllUsers to the existing import from adminController.js
import {
  listUsers, updateUserStatus, assignAdminRole, listKycSubmissions, reviewKyc,
  listPendingShops, reviewShop, listPendingProducts, reviewProduct,
  createAd, listActiveAds, deleteAd, getSettings, updateSettings, platformWalletSummary,
  forceLogoutAllUsers
} from '../controllers/adminController.js';

import { listUpgrades, reviewUpgrade } from '../controllers/upgradeController.js';
import { listWithdrawals, reviewWithdrawal } from '../controllers/walletsController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth, requireAdmin);

// Users
router.get('/users', listUsers);
router.patch('/users/:userId/status', updateUserStatus);
router.post('/users/:userId/make-admin', assignAdminRole);

// Role upgrades — payment verification, KYC review, final approval.
// Single endpoint drives every stage via `action` in the body:
// verify_payment | reject_payment | verify_kyc | reject_kyc | approve | reject
router.get('/upgrades', listUpgrades);
router.patch('/upgrades/:id', reviewUpgrade);

// Shops & products (unrelated to the upgrade lifecycle — separate approval queue)
router.get('/shops/pending', listPendingShops);
router.post('/shops/:id/review', reviewShop);
router.get('/products/pending', listPendingProducts);
router.post('/products/:id/review', reviewProduct);

// Ads
router.post('/ads', createAd);
router.delete('/ads/:id', deleteAd);

// Withdrawals
router.get('/withdrawals', listWithdrawals);
router.post('/withdrawals/:id/review', reviewWithdrawal);

// Platform settings & wallet summary
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.get('/wallet-summary', platformWalletSummary);
// add this route alongside the existing ones:
router.post('/security/force-logout-all', forceLogoutAllUsers);
export default router;
