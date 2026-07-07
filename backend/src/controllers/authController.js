import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import cryptoRandomString from 'crypto-random-string';
import { query } from '../config/db.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { getAuthPolicy } from '../services/authPolicyService.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeUsername = (username) => String(username || '').trim().toLowerCase();

const DUMMY_HASH = '$2a$12$CwTycUXWue0Thq9StjUM0uJ8u8q8u8q8u8q8u8q8u8q8u8q8u8q8u';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const USERNAME_REGEX = /^[a-z0-9_.]{3,30}$/;
const PASSWORD_COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

function clientIp(req) {
  return req.ip || req.headers['x-forwarded-for'] || 'unknown';
}

async function logLoginAttempt(identifier, req, success) {
  await query(
    `INSERT INTO login_attempts (email, ip_address, success, user_agent) VALUES ($1,$2,$3,$4)`,
    [identifier, clientIp(req), success, req.headers['user-agent'] || null]
  );
}

function validatePassword(password, policy) {
  const minLen = policy?.min_password_length || 8;
  if (!password || password.length < minLen) {
    return `Password must be at least ${minLen} characters.`;
  }
  if (password.length > 128) {
    return 'Password is too long.';
  }
  if (!PASSWORD_COMPLEXITY.test(password)) {
    return 'Password must include an uppercase letter, a lowercase letter, and a number.';
  }
  return null;
}

export async function registerStep1(req, res) {
  const { fullName, email, phoneNumber } = req.body;

  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'Full name is required.' });
  }
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!phoneNumber || !PHONE_REGEX.test(phoneNumber.trim())) {
    return res.status(400).json({ error: 'Phone number must include a country code, e.g. +256700000000.' });
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = phoneNumber.trim();

  try {
    const existingEmail = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
    }
    const existingPhone = await query('SELECT id FROM users WHERE phone_number = $1', [normalizedPhone]);
    if (existingPhone.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this phone number already exists.' });
    }

    await query(`UPDATE pending_registrations SET used = TRUE WHERE email = $1 AND used = FALSE`, [normalizedEmail]);

    const rawToken = cryptoRandomString({ length: 48, type: 'url-safe' });
    const tokenHash = hashToken(rawToken);

    await query(
      `INSERT INTO pending_registrations (full_name, email, phone_number, token_hash, expires_at)
       VALUES ($1, $2, $3, $4, now() + interval '15 minutes')`,
      [fullName.trim(), normalizedEmail, normalizedPhone, tokenHash]
    );

    return res.status(201).json({
      status: 'step_1_complete',
      message: 'Basic details verified. Continue to set your username and password.',
      registrationToken: rawToken,
      expiresInMinutes: 15
    });
  } catch (err) {
    console.error('Register step 1 error:', err);
    return res.status(500).json({ error: 'Could not process registration. Please try again.' });
  }
}

export async function registerStep2(req, res) {
  const { registrationToken, username, password } = req.body;

  if (!registrationToken) {
    return res.status(400).json({ error: 'Registration token is required. Please restart registration.' });
  }
  if (!username || !USERNAME_REGEX.test(normalizeUsername(username))) {
    return res.status(400).json({ error: 'Username must be 3-30 characters: lowercase letters, numbers, dots, or underscores only.' });
  }

  const policy = await getAuthPolicy();
  const passwordError = validatePassword(password, policy);
  if (passwordError) return res.status(400).json({ error: passwordError });

  const normalizedUsername = normalizeUsername(username);
  const tokenHash = hashToken(registrationToken);

  try {
    const pendingResult = await query(
      `SELECT * FROM pending_registrations WHERE token_hash = $1 AND used = FALSE AND expires_at > now()`,
      [tokenHash]
    );
    const pending = pendingResult.rows[0];
    if (!pending) {
      return res.status(400).json({ error: 'This registration session has expired or is invalid. Please start over.' });
    }

    const existingUsername = await query('SELECT id FROM users WHERE username = $1', [normalizedUsername]);
    if (existingUsername.rows.length > 0) {
      return res.status(409).json({ error: 'That username is already taken.' });
    }
    const existingEmail = await query('SELECT id FROM users WHERE email = $1', [pending.email]);
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
    }
    const existingPhone = await query('SELECT id FROM users WHERE phone_number = $1', [pending.phone_number]);
    if (existingPhone.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this phone number already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userResult = await query(
      `INSERT INTO users (full_name, email, phone_number, username, password_hash, is_verified)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, email, username, full_name, phone_number, primary_role, is_admin, status, kyc_status, is_verified, created_at`,
      [pending.full_name, pending.email, pending.phone_number, normalizedUsername, passwordHash]
    );
    const user = userResult.rows[0];

    await query('UPDATE pending_registrations SET used = TRUE WHERE id = $1', [pending.id]);

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '7 days')`,
      [user.id, hashToken(refreshToken)]
    );

    return res.status(201).json({
      status: 'registration_complete',
      message: 'Account created successfully.',
      user, accessToken, refreshToken
    });
  } catch (err) {
    console.error('Register step 2 error:', err);
    return res.status(500).json({ error: 'Could not complete registration. Please try again.' });
  }
}

export async function login(req, res) {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username and password are all required.' });
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);
  const genericError = { error: 'Invalid credentials.' };
  const loginIdentifier = `${normalizedEmail}|${normalizedUsername}`;

  try {
    const policy = await getAuthPolicy();

    const ipAttempts = await query(
      `SELECT COUNT(*) FROM login_attempts
       WHERE ip_address = $1 AND success = FALSE AND created_at > now() - interval '5 minutes'`,
      [clientIp(req)]
    );
    if (Number(ipAttempts.rows[0].count) >= 20) {
      return res.status(429).json({ error: 'Too many failed attempts from this network. Please try again later.' });
    }

    const result = await query(
      `SELECT id, email, username, password_hash, full_name, phone_number, primary_role, is_admin, status,
              kyc_status, is_verified, locked_until, failed_login_count
       FROM users WHERE email = $1`,
      [normalizedEmail]
    );
    const user = result.rows[0];

    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      await logLoginAttempt(loginIdentifier, req, false);
      return res.status(401).json(genericError);
    }

    if (normalizeUsername(user.username) !== normalizedUsername) {
      await bcrypt.compare(password, DUMMY_HASH);
      await logLoginAttempt(loginIdentifier, req, false);
      return res.status(401).json(genericError);
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({ error: `Too many failed attempts. Try again in ${minutesLeft} minute(s).` });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      await logLoginAttempt(loginIdentifier, req, false);
      const newCount = (user.failed_login_count || 0) + 1;

      if (newCount >= policy.max_failed_logins) {
        await query(
          `UPDATE users SET failed_login_count = 0, locked_until = now() + ($1 || ' minutes')::interval WHERE id = $2`,
          [policy.lockout_minutes, user.id]
        );
        return res.status(423).json({ error: `Too many failed attempts. Your account is locked for ${policy.lockout_minutes} minutes.` });
      }

      await query('UPDATE users SET failed_login_count = $1 WHERE id = $2', [newCount, user.id]);
      return res.status(401).json(genericError);
    }

    if (user.status === 'suspended') {
      await logLoginAttempt(loginIdentifier, req, false);
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }
    if (user.status === 'rejected') {
      await logLoginAttempt(loginIdentifier, req, false);
      return res.status(403).json({ error: 'This account is not active. Contact support.' });
    }
    if (!user.is_verified) {
      await logLoginAttempt(loginIdentifier, req, false);
      return res.status(403).json({ error: 'This account has not completed registration.' });
    }

    await query('UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = $1', [user.id]);
    await logLoginAttempt(loginIdentifier, req, true);

    delete user.password_hash;
    delete user.locked_until;
    delete user.failed_login_count;

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '7 days')`,
      [user.id, hashToken(refreshToken)]
    );

    return res.json({ message: 'Signed in successfully.', user, accessToken, refreshToken });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Could not sign in. Please try again.' });
  }
}

export async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token is required.' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const stored = await query(
      `SELECT id FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND revoked = FALSE AND expires_at > now()`,
      [payload.sub, tokenHash]
    );
    if (stored.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token is invalid or expired. Please sign in again.' });
    }

    const userResult = await query(
      `SELECT id, primary_role, is_admin, status FROM users WHERE id = $1`,
      [payload.sub]
    );
    const user = userResult.rows[0];
    if (!user || user.status === 'suspended' || user.status === 'rejected') {
      return res.status(401).json({ error: 'Account not found or inactive. Please sign in again.' });
    }

    const accessToken = signAccessToken(user);
    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Refresh token is invalid or expired. Please sign in again.' });
  }
}

export async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await query(`UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1`, [hashToken(refreshToken)]);
  }
  return res.json({ message: 'Signed out.' });
}

export async function logoutAllSessions(req, res) {
  await query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [req.user.id]);
  return res.json({ message: 'Signed out of all devices.' });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const normalizedEmail = normalizeEmail(email);
  const genericResponse = { message: 'If an account exists for that email, a reset link has been sent.' };

  try {
    const result = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (result.rows.length === 0) return res.json(genericResponse);

    const user = result.rows[0];
    const rawToken = cryptoRandomString({ length: 48, type: 'url-safe' });

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '15 minutes')`,
      [user.id, hashToken(rawToken)]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&uid=${user.id}`;
    await sendPasswordResetEmail(normalizedEmail, resetLink);

    return res.json(genericResponse);
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Could not process request. Please try again.' });
  }
}

export async function resetPassword(req, res) {
  const { uid, token, newPassword } = req.body;
  if (!uid || !token || !newPassword) {
    return res.status(400).json({ error: 'Missing reset details.' });
  }

  const policy = await getAuthPolicy();
  const passwordError = validatePassword(newPassword, policy);
  if (passwordError) return res.status(400).json({ error: passwordError });

  try {
    const tokenHash = hashToken(token);
    const result = await query(
      `SELECT id FROM password_reset_tokens
       WHERE user_id = $1 AND token_hash = $2 AND used = FALSE AND expires_at > now()`,
      [uid, tokenHash]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await query(
      'UPDATE users SET password_hash = $1, failed_login_count = 0, locked_until = NULL WHERE id = $2',
      [passwordHash, uid]
    );
    await query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [result.rows[0].id]);
    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [uid]);

    return res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Could not reset password. Please try again.' });
  }
}

export async function getMe(req, res) {
  try {
    const result = await query(
      `SELECT id, email, username, full_name, phone_number, is_verified, location_country, location_city,
              primary_role, is_admin, status, kyc_status, avatar_url, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ error: 'Could not load profile.' });
  }
}
