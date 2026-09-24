import { Router } from 'express';
import { college } from '../config/college.js';
import { districts, tehsils } from '../config/pakistan.js';
import { Program } from '../models/Program.js';
import { Content } from '../models/Content.js';
import { admissionsAreOpen, assertPersonName } from '../utils/helpers.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

router.get('/settings', async (_req, res) => {
  const open = await admissionsAreOpen();
  res.json({ college, admissionsOpen: open, districts, tehsils });
});

router.get('/home', async (_req, res) => {
  const [programs, announcements, galleryItems, admissionsOpen] = await Promise.all([
    Program.find({ is_active: true }).sort({ name: 1 }).limit(6),
    Content.find({ type: 'announcement', is_active: true }).sort({ published_at: -1 }).limit(4),
    Content.find({ type: 'gallery', is_active: true }).sort({ sort_order: 1, createdAt: -1 }),
    admissionsAreOpen(),
  ]);
  res.json({ programs, announcements, galleryItems, admissionsOpen });
});

router.get('/about', async (_req, res) => {
  const types = ['vision', 'mission', 'history', 'principal_message'];
  const rows = await Content.find({ type: { $in: types }, is_active: true });
  const byType = Object.fromEntries(types.map((t) => [t, rows.find((r) => r.type === t) || null]));
  res.json(byType);
});

router.get('/programs', async (_req, res) => {
  const programs = await Program.find({ is_active: true }).sort({ name: 1 });
  res.json({ programs });
});

router.get('/admission', async (_req, res) => {
  const types = [
    'admission_schedule',
    'eligibility_criteria',
    'required_documents',
    'admission_guidelines',
    'selected_candidates_pdf',
  ];
  const rows = await Content.find({ type: { $in: types }, is_active: true });
  const byType = Object.fromEntries(types.map((t) => [t, rows.find((r) => r.type === t) || null]));
  const admissionsOpen = await admissionsAreOpen();
  res.json({ ...byType, admissionsOpen });
});

router.post('/contact', (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !subject || !message) {
    return res.status(422).json({ message: 'Please fill all required fields.' });
  }
  const nameError = assertPersonName(name, 'Name');
  if (nameError) return res.status(422).json({ message: nameError });
  res.json({ message: 'Thank you! Your message has been received.' });
});

export default router;
