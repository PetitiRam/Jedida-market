import { verifyAccessToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role, isAdmin: payload.isAdmin };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or token invalid. Please sign in again.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated.' });
    if (!roles.includes(req.user.role) && !req.user.isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  try {
    const payload = verifyAccessToken(header.split(' ')[1]);
    req.user = { id: payload.sub, role: payload.role, isAdmin: payload.isAdmin };
  } catch { /* not authenticated — proceed without req.user */ }
  next();
}
export function requireAdmin(req, res, next) {
  try {
    // assumes authenticate middleware already attached req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    // adjust this depending on your user model
    const isAdmin =
      req.user.role === 'admin' ||
      req.user.isAdmin === true;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Authorization check failed'
    });
  }
}
