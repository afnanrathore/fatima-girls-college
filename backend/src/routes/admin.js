import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { Program } from '../models/Program.js';
import { Application, normalizeCnic, normalizePhone } from '../models/Application.js';
import { Content } from '../models/Content.js';
import { galleryUpload, selectedPdfUpload, applicationUpload, uploadsRoot } from '../middleware/upload.js';
import { admissionsAreOpen, uploadPath, assertPersonName } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/dashboard', async (_req, res) => {
  const [total, pending, approved, rejected, under_review, interview_scheduled, programs, announcements, admissionsOpen] =
    await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'approved' }),
      Application.countDocuments({ status: 'rejected' }),
      Application.countDocuments({ status: 'under_review' }),
      Application.countDocuments({ status: 'interview_scheduled' }),
      Program.countDocuments(),
      Content.countDocuments({ type: 'announcement' }),
      admissionsAreOpen(),
    ]);
  res.json({
    stats: { total, pending, approved, rejected, under_review, interview_scheduled, programs, announcements },
    admissionsOpen,
  });
});

router.post('/admissions/toggle', async (_req, res) => {
  let row = await Content.findOne({ type: 'admission_status' });
  const next = (await admissionsAreOpen()) ? 'closed' : 'open';
  if (!row) {
    row = await Content.create({
      type: 'admission_status',
      title: 'Admission Status',
      content: next,
      is_active: true,
    });
  } else {
    row.content = next;
    await row.save();
  }
  res.json({ admissionsOpen: next === 'open' });
});

/* Programs */
router.get('/programs', async (_req, res) => {
  res.json({ programs: await Program.find().sort({ name: 1 }) });
});

router.post('/programs', async (req, res) => {
  const program = await Program.create(req.body);
  res.status(201).json({ program });
});

router.put('/programs/:id', async (req, res) => {
  const program = await Program.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!program) return res.status(404).json({ message: 'Not found' });
  res.json({ program });
});

router.delete('/programs/:id', async (req, res) => {
  await Program.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

/* Applicants */
router.get('/applicants', async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const q = String(req.query.q);
    filter.$or = [
      { full_name: new RegExp(q, 'i') },
      { application_id: new RegExp(q, 'i') },
      { cnic: new RegExp(q.replace(/\D/g, ''), 'i') },
      { email: new RegExp(q, 'i') },
    ];
  }
  const applicants = await Application.find(filter)
    .populate('program_id')
    .sort({ submitted_at: -1, createdAt: -1 });
  res.json({ applicants });
});

router.get('/applicants/:id', async (req, res) => {
  const application = await Application.findById(req.params.id).populate('program_id');
  if (!application) return res.status(404).json({ message: 'Not found' });
  res.json({ application });
});

router.put('/applicants/:id', async (req, res) => {
  const body = { ...req.body };
  if (body.cnic) body.cnic = normalizeCnic(body.cnic);
  if (body.email) body.email = String(body.email).toLowerCase().trim();
  if (body.phone) body.phone = normalizePhone(body.phone);
  if (body.father_phone) body.father_phone = normalizePhone(body.father_phone);
  if (body.marks_obtained && body.total_marks) {
    body.percentage = Math.round((Number(body.marks_obtained) / Number(body.total_marks)) * 10000) / 100;
  }

  const nameErrors = [
    body.full_name != null ? assertPersonName(body.full_name, 'Full name') : null,
    body.father_name != null ? assertPersonName(body.father_name, "Father's name") : null,
    body.mother_name ? assertPersonName(body.mother_name, "Mother's name") : null,
  ].filter(Boolean);
  if (nameErrors.length) return res.status(422).json({ message: nameErrors[0], field: 'full_name' });

  if (body.email) {
    const emailTaken = await Application.exists({
      email: body.email,
      _id: { $ne: req.params.id },
    });
    if (emailTaken) {
      return res.status(422).json({
        message: 'This email is already used on another application.',
        field: 'email',
      });
    }
  }

  if (body.cnic) {
    const cnicTaken = await Application.exists({
      cnic: body.cnic,
      _id: { $ne: req.params.id },
    });
    if (cnicTaken) {
      return res.status(422).json({
        message: 'This CNIC / B-Form is already used on another application.',
        field: 'cnic',
      });
    }
  }

  try {
    const application = await Application.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    }).populate('program_id');
    if (!application) return res.status(404).json({ message: 'Not found' });
    res.json({ application, message: 'Applicant details updated successfully.' });
  } catch (e) {
    if (e?.code === 11000) {
      const key = Object.keys(e.keyPattern || {})[0] || 'email';
      const label = key === 'cnic' ? 'CNIC / B-Form' : key === 'email' ? 'email' : key;
      return res.status(422).json({
        message: `This ${label} is already used on another application.`,
        field: key,
      });
    }
    res.status(500).json({ message: e.message || 'Update failed.' });
  }
});

router.put('/applicants/:id/status', async (req, res) => {
  const { status, remarks } = req.body;
  const application = await Application.findByIdAndUpdate(
    req.params.id,
    { status, remarks },
    { new: true }
  ).populate('program_id');
  if (!application) return res.status(404).json({ message: 'Not found' });
  res.json({ application, message: 'Status updated successfully.' });
});

router.get('/applicants/:id/document/:type', async (req, res) => {
  const map = {
    photo: 'photo_path',
    cnic_copy: 'cnic_copy_path',
    cnic_back: 'cnic_back_path',
    domicile: 'domicile_path',
    marksheet: 'marksheet_path',
    other: 'other_docs_path',
  };
  const field = map[req.params.type];
  const application = await Application.findById(req.params.id);
  if (!application || !field || !application[field]) return res.status(404).end();
  const filePath = path.join(uploadsRoot, application[field]);
  if (!fs.existsSync(filePath)) return res.status(404).end();
  res.sendFile(filePath);
});

const DOC_FIELDS = {
  photo: 'photo_path',
  cnic_copy: 'cnic_copy_path',
  cnic_back: 'cnic_back_path',
  domicile: 'domicile_path',
  marksheet: 'marksheet_path',
  other: 'other_docs_path',
};

router.post('/applicants/:id/document/:type', (req, res) => {
  const field = DOC_FIELDS[req.params.type];
  if (!field) return res.status(400).json({ message: 'Invalid document type.' });

  applicationUpload.single('document')(req, res, async (err) => {
    try {
      if (err) return res.status(422).json({ message: err.message });
      if (!req.file) return res.status(422).json({ message: 'Please choose a file.' });

      const application = await Application.findById(req.params.id);
      if (!application) return res.status(404).json({ message: 'Not found' });

      if (application[field]) {
        const oldPath = path.join(uploadsRoot, application[field]);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch { /* ignore */ }
        }
      }

      application[field] = uploadPath(req.file);
      await application.save();
      const updated = await Application.findById(application._id).populate('program_id');
      res.json({ application: updated, message: 'Document updated.' });
    } catch (e) {
      res.status(500).json({ message: e.message || 'Upload failed.' });
    }
  });
});

router.delete('/applicants/:id/document/:type', async (req, res) => {
  const field = DOC_FIELDS[req.params.type];
  if (!field) return res.status(400).json({ message: 'Invalid document type.' });
  const application = await Application.findById(req.params.id);
  if (!application) return res.status(404).json({ message: 'Not found' });

  if (application[field]) {
    const oldPath = path.join(uploadsRoot, application[field]);
    if (fs.existsSync(oldPath)) {
      try { fs.unlinkSync(oldPath); } catch { /* ignore */ }
    }
    application[field] = undefined;
    await application.save();
  }

  const updated = await Application.findById(application._id).populate('program_id');
  res.json({ application: updated, message: 'Document removed.' });
});

router.post('/applicants/download-pdf', async (_req, res) => {
  const selected = await Application.find({ status: 'approved' }).populate('program_id').sort({ full_name: 1 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=selected-applicants.pdf');
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  doc.fontSize(18).text('Fatima Girls College — Selected Applicants', { align: 'center' });
  doc.moveDown();
  doc.fontSize(11);
  selected.forEach((a, i) => {
    doc.text(
      `${i + 1}. ${a.full_name} | ${a.application_id} | ${a.cnic} | ${a.program_id?.name || ''} | ${a.percentage}%`
    );
  });
  if (!selected.length) doc.text('No approved applicants yet.');
  doc.end();
});

router.post('/applicants/upload-selected-pdf', (req, res) => {
  selectedPdfUpload.single('pdf')(req, res, async (err) => {
    if (err) return res.status(422).json({ message: err.message });
    if (!req.file) return res.status(422).json({ message: 'PDF required' });
    const image_path = uploadPath(req.file);
    let row = await Content.findOne({ type: 'selected_candidates_pdf' });
    if (!row) {
      row = await Content.create({
        type: 'selected_candidates_pdf',
        title: 'Selected Candidates',
        image_path,
        is_active: true,
      });
    } else {
      row.image_path = image_path;
      row.is_active = true;
      await row.save();
    }
    res.json({ content: row });
  });
});

/* Announcements */
router.get('/announcements', async (_req, res) => {
  const announcements = await Content.find({ type: 'announcement' }).sort({ published_at: -1 });
  res.json({ announcements });
});

router.post('/announcements', async (req, res) => {
  const announcement = await Content.create({
    type: 'announcement',
    title: req.body.title,
    content: req.body.content,
    is_active: req.body.is_active !== false && req.body.is_active !== 'false',
    published_at: req.body.published_at ? new Date(req.body.published_at) : new Date(),
  });
  res.status(201).json({ announcement });
});

router.put('/announcements/:id', async (req, res) => {
  const announcement = await Content.findOneAndUpdate(
    { _id: req.params.id, type: 'announcement' },
    {
      title: req.body.title,
      content: req.body.content,
      is_active: req.body.is_active !== false && req.body.is_active !== 'false',
      published_at: req.body.published_at ? new Date(req.body.published_at) : undefined,
    },
    { new: true }
  );
  if (!announcement) return res.status(404).json({ message: 'Not found' });
  res.json({ announcement });
});

router.delete('/announcements/:id', async (req, res) => {
  await Content.deleteOne({ _id: req.params.id, type: 'announcement' });
  res.json({ ok: true });
});

/* Gallery */
router.get('/gallery', async (_req, res) => {
  const items = await Content.find({ type: 'gallery' }).sort({ sort_order: 1, createdAt: -1 });
  res.json({ items });
});

router.post('/gallery', (req, res) => {
  galleryUpload.single('image')(req, res, async (err) => {
    if (err) return res.status(422).json({ message: err.message });
    if (!req.file) return res.status(422).json({ message: 'Image required' });
    const item = await Content.create({
      type: 'gallery',
      title: req.body.title || 'Gallery',
      image_path: uploadPath(req.file),
      is_active: true,
    });
    res.status(201).json({ item });
  });
});

router.delete('/gallery/:id', async (req, res) => {
  const item = await Content.findOne({ _id: req.params.id, type: 'gallery' });
  if (item?.image_path) {
    const fp = path.join(uploadsRoot, item.image_path);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  await Content.deleteOne({ _id: req.params.id, type: 'gallery' });
  res.json({ ok: true });
});

export default router;
