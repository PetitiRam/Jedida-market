import express from 'express';
import {
  createShop, getMyShop, updateMyShop, getPublicShopBySlug, listAllShops
} from '../controllers/shopsController.js';
import { requireAuth } from '../middleware/auth.js';
import { updateShopSettings, setFeaturedProducts, getPublicShopBySlugV2 } from '../controllers/shopsController.js';

const router = express.Router();

router.post('/', requireAuth, createShop);
router.get('/me', requireAuth, getMyShop);
router.patch('/me', requireAuth, updateMyShop);
router.get('/public/:slug', getPublicShopBySlug); // used by SPA + social-preview HTML route
router.get('/', listAllShops); // Main Marketplace "Shops" tab
router.patch('/me/settings', requireAuth, updateShopSettings);
router.patch('/me/featured', requireAuth, setFeaturedProducts);
router.get('/public-v2/:slug', getPublicShopBySlugV2); // richer payload; old /public/:slug stays untouched

export default router;
