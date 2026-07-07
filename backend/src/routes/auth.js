import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerStep1, registerStep2, login, refresh, logout, logoutAllSessions,
  forgotPassword, resetPassword, getMe
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: { error: 'Too many sign-in attempts. Please wait a few minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false
});

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many registration attempts. Please wait and try again.' }
});

router.post('/register/step-1', registrationLimiter, registerStep1);
router.post('/register/step-2', registrationLimiter, registerStep2);

router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout-all', requireAuth, logoutAllSessions);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', requireAuth, getMe);

export default router;
