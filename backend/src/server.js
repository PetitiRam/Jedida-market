import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import http from 'http';

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
import kycRoutes from './routes/kyc.js';
import settingsCenterRoutes from './routes/settingsCenter.js';
import publicSettingsCenterRoutes from './routes/publicSettingsCenter.js';
import reviewRoutes from './routes/reviews.js';
import questionRoutes from './routes/questions.js';
import chatV2Routes from './routes/chatV2.js';
import commerceActionsRoutes from './routes/commerceActions.js';
import couponsRoutes from './routes/coupons.js';
import adminPaymentsRoutes from './routes/adminPaymentsRoutes.js';

// Conditionally import AI routes only if they exist
let petitiRoutes = null;
let tausiRoutes = null;
let publicPetitiRoutes = null;

try {
  const petitiModule = await import('../ai/petiti/petitiRoutes.js');
  petitiRoutes = petitiModule.default || petitiModule;
} catch (err) {
  console.warn('⚠️  PETITI routes not available');
}

try {
  const tausiModule = await import('../ai/tausi/tausiRoutes.js');
  tausiRoutes = tausiModule.default || tausiModule;
} catch (err) {
  console.warn('⚠️  TAUSI routes not available');
}

try {
  const publicPetitiModule = await import('./routes/publicPetiti.js');
  publicPetitiRoutes = publicPetitiModule.default || publicPetitiModule;
} catch (err) {
  console.warn('⚠️  Public PETITI routes not available');
}

try {
  const uploadsModule = await import('./routes/uploads.js');
  const uploadsRoutes = uploadsModule.default || uploadsModule;
} catch (err) {
  console.warn('⚠️  Uploads routes not available');
}

dotenv.config();

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many attempts. Please try again later.' }
});

// Root-level route
app.use(shareLinkPreviewRoutes);

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/upgrade', upgradeRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/reviews', reviewRoutes);
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
app.use('/api/kyc', kycRoutes);
app.use('/api/admin/settings-center', settingsCenterRoutes);
app.use('/api/settings', publicSettingsCenterRoutes);
app.use('/api/admin/payments', adminPaymentsRoutes);
app.use('/api/chat-v2', chatV2Routes);
app.use('/api', commerceActionsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/questions', questionRoutes);

// Conditionally register AI routes
if (petitiRoutes) {
  app.use('/api/ai/petiti', petitiRoutes);
}
if (tausiRoutes) {
  app.use('/api/ai/tausi', tausiRoutes);
}
if (publicPetitiRoutes) {
  app.use('/api/site', publicPetitiRoutes);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'JEDIDIA Marketplace API', phase: 6 });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something went wrong on our end.' });
});

// Initialize Socket.IO with error handling
const httpServer = http.createServer(app);

try {
  const { initChatSocket } = await import('./chat/chatSocket.js');
  initChatSocket(httpServer, process.env.FRONTEND_URL);
  console.log('✓ Chat socket initialized');
} catch (err) {
  console.warn('⚠️  Chat socket initialization skipped:', err.message);
}

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🟢 JEDIDIA Marketplace API running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
