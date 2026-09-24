import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { requireAuth, setAuthCookie, signToken } from '../middleware/auth.js';

const router = Router();

async function handleSignin(req, res) {
  const email = String(req.body.email || '').toLowerCase().trim();
  const password = String(req.body.password || '');
  const rememberMe = Boolean(req.body.rememberMe);
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(422).json({ message: 'These credentials do not match our records.' });
  }
  const token = signToken(user, rememberMe);
  setAuthCookie(res, token, rememberMe);
  res.json({
    token,
    rememberMe,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}

router.post('/signin', handleSignin);
router.post('/login', handleSignin);

router.post('/logout', (_req, res) => {
  res.clearCookie('fgc_token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/forgot-password', async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  if (!email) return res.status(422).json({ message: 'Email is required.', field: 'email' });

  const user = await User.findOne({ email, role: 'admin' });
  const generic = {
    message: 'If that email is registered, password reset instructions are available.',
  };

  if (!user) return res.json(generic);

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${base}/reset-password?token=${rawToken}`;

  // No mailer configured — return link so the admin can complete reset in this environment.
  res.json({
    ...generic,
    resetLink,
  });
});

router.post('/reset-password', async (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  const passwordConfirm = String(req.body.password_confirm || req.body.passwordConfirm || '');

  if (!token) return res.status(422).json({ message: 'Reset token is required.' });
  if (!password || password.length < 6) {
    return res.status(422).json({ message: 'Password must be at least 6 characters.', field: 'password' });
  }
  if (password !== passwordConfirm) {
    return res.status(422).json({ message: 'Passwords do not match.', field: 'password_confirm' });
  }

  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(422).json({ message: 'This reset link is invalid or has expired.' });
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password updated successfully. You can sign in now.' });
});

export default router;
