import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export function signToken(user, rememberMe = false) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: rememberMe ? '30d' : '1d' }
  );
}

export function setAuthCookie(res, token, rememberMe = false) {
  res.cookie('fgc_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  });
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
    const token = bearer || req.cookies?.fgc_token;
    if (!token) return res.status(401).json({ message: 'Unauthenticated' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Unauthenticated' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthenticated' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}
