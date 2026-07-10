import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import upgradeRoutes from './routes/upgrade.js';
import shopRoutes from './routes/shops.js';
import productRoutes from './routes/products.js';
import templateRoutes from './routes/templates.js';
import notificationRoutes from './routes/notifications.js';
import shareLinkPreviewRoutes from './routes/shareLinkPreview.js';
import orderRoutes from './routes/orders.js';
import walletRoutes from './routes/wallets.js';
import adminRoutes from './routes/admin.js';
import adsRoutes from './routes/ads.js';
import publicSettingsRoutes from './routes/publicSettings.js';
import chatRoutes from './routes/chat.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import petitiRoutes from '../ai/petiti/petitiRoutes.js';
import tausiRoutes from '../ai/tausi/tausiRoutes.js';
import publicPetitiRoutes from './routes/publicPetiti.js';
import uploadsRoutes from './routes/uploads.js';
// near the other route imports:
import kycRoutes from './routes/kyc.js';
import settingsCenterRoutes from './routes/settingsCenter.js';
import publicSettingsCenterRoutes from './routes/publicSettingsCenter.js';
import reviewRoutes from './routes/reviews.js';
import questionRoutes from './routes/questions.js';
import http from 'http';
import { initChatSocket } from './chat/chatSocket.js';
import chatV2Routes from './routes/chatV2.js';
import commerceActionsRoutes from './routes/commerceActions.js';
import couponsRoutes from './routes/coupons.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1); // required behind Railway/Render/Netlify-style reverse proxies

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many attempts. Please try again later.' }
});

// Root-level route (not under /api): this is the actual link sellers share
// on social media — it serves Open Graph meta tags for crawlers, then
// redirects real visitors into the SPA. See routes/shareLinkPreview.js.
app.use(shareLinkPreviewRoutes);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/upgrade', upgradeRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', reviewRoutes);
app.use('/api/products', productRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/settings', publicSettingsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/ai/petiti', petitiRoutes);
app.use('/api/ai/tausi', tausiRoutes);
app.use('/api/site', publicPetitiRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/admin/settings-center', settingsCenterRoutes);
app.use('/api/settings', publicSettingsCenterRoutes);
app.use(
'/questions',
questionRoutes
);

app.use('/api/chat-v2', chatV2Routes);
app.use('/api', commerceActionsRoutes);
app.use('/api/coupons', couponsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'JEDIDA Marketplace API', phase: 4 });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end.' });
});

// Replace your existing `app.listen(PORT, ...)` at the bottom with:
const httpServer = http.createServer(app);
initChatSocket(httpServer, process.env.FRONTEND_URL);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🟢 JEDIDA Marketplace API + real-time chat running on port ${PORT}`);
});
