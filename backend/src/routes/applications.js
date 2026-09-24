import { Router } from 'express';
import { Program } from '../models/Program.js';
import {
  Application,
  generateApplicationId,
  normalizeCnic,
  normalizePhone,
  phoneDigits,
} from '../models/Application.js';
import { college } from '../config/college.js';
import { districts } from '../config/pakistan.js';
import { applicationUpload } from '../middleware/upload.js';
import { admissionsAreOpen, uploadPath, nameRe } from '../utils/helpers.js';

const router = Router();

const uploadFields = applicationUpload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'cnic_copy', maxCount: 1 },
  { name: 'cnic_back', maxCount: 1 },
  { name: 'domicile', maxCount: 1 },
  { name: 'marksheet', maxCount: 1 },
]);

router.get('/meta', async (_req, res) => {
  const [programs, open] = await Promise.all([
    Program.find({ is_active: true }).sort({ name: 1 }),
    admissionsAreOpen(),
  ]);
  res.json({ programs, admissionsOpen: open, college });
});

router.get('/check-id', async (req, res) => {
  const cnic = normalizeCnic(req.query.cnic);
  const taken = cnic ? !!(await Application.exists({ cnic })) : false;
  res.json({ taken });
});

router.get('/check-email', async (req, res) => {
  const email = String(req.query.email || '').toLowerCase().trim();
  const taken = email ? !!(await Application.exists({ email })) : false;
  res.json({ taken });
});

router.get('/check-phone', async (req, res) => {
  const digits = phoneDigits(req.query.phone);
  if (!digits) return res.json({ taken: false });
  const apps = await Application.find({}, { phone: 1, father_phone: 1 }).lean();
  const taken = apps.some(
    (a) => phoneDigits(a.phone) === digits || phoneDigits(a.father_phone) === digits
  );
  res.json({ taken });
});

router.post('/', (req, res) => {
  uploadFields(req, res, async (err) => {
    try {
      if (err) return res.status(422).json({ message: err.message });
      if (!(await admissionsAreOpen())) {
        return res.status(403).json({ message: 'Admissions are currently closed.' });
      }

      const body = { ...req.body };
      body.cnic = normalizeCnic(body.cnic);
      body.father_cnic = normalizeCnic(body.father_cnic);
      body.phone = normalizePhone(body.phone);
      body.father_phone = normalizePhone(body.father_phone);

      const program = await Program.findById(body.program_id);
      if (!program) return res.status(422).json({ message: 'Invalid program.' });
      const isBs = program.isBsProgram();
      const errors = [];

      const requireName = (field, label) => {
        if (!body[field] || !nameRe.test(body[field])) errors.push(`${label} may only contain letters.`);
      };

      if (!body.full_name) errors.push('Full name is required.');
      else requireName('full_name', 'Full name');
      if (!body.date_of_birth) errors.push('Date of birth is required.');
      if (!body.cnic) errors.push('CNIC / B-Form is required.');
      if (!['cnic', 'bform'].includes(body.id_document_type)) errors.push('Invalid ID document type.');
      if (!['Female', 'Male'].includes(body.gender)) errors.push('Gender is required.');
      if (!college.religions.includes(body.religion) && body.religion !== 'Other') {
        /* allow religion_other merge below */
      }
      if (body.religion === 'Other') body.religion = body.religion_other;
      if (!body.religion) errors.push('Religion is required.');
      if (!college.nationalities.includes(body.nationality)) errors.push('Nationality is required.');
      if (!body.email) errors.push('Email is required.');
      if (!body.phone) errors.push('Phone is required.');
      if (!body.address) errors.push('Address is required.');
      requireName('father_name', "Father's name");
      if (!body.father_cnic) errors.push("Father's CNIC is required.");
      if (!body.father_phone) errors.push("Father's phone is required.");
      if (body.mother_name) requireName('mother_name', "Mother's name");
      requireName('previous_school', 'School name');
      if (body.board === 'Other') body.board = body.board_other;
      if (!body.board) errors.push('Board is required.');
      if (body.grade === 'Other') body.grade = body.grade_other;
      if (!body.grade) errors.push('Grade is required.');
      const marks = Number(body.marks_obtained);
      const total = Number(body.total_marks);
      if (!(marks >= 0) || !(total > marks)) errors.push('Marks are invalid.');

      if (isBs) {
        if (!districts[body.province]) errors.push('Province is required for BS programs.');
        const list = districts[body.province] || [];
        if (!list.includes(body.domicile_district)) errors.push('Domicile district is required.');
        if (!list.includes(body.district)) errors.push('District is required.');
        if (!body.tehsil) errors.push('Tehsil is required.');
      }

      if (await Application.exists({ cnic: body.cnic })) {
        errors.push('An application with this CNIC / B-Form has already been submitted.');
      }
      if (await Application.exists({ email: String(body.email).toLowerCase() })) {
        errors.push('This email is already used on another application.');
      }
      const appDigits = phoneDigits(body.phone);
      const fatherDigits = phoneDigits(body.father_phone);
      if (appDigits && appDigits === fatherDigits) {
        errors.push('Applicant and father cannot use the same phone number.');
      }
      const phoneApps = await Application.find({}, { phone: 1, father_phone: 1 }).lean();
      for (const a of phoneApps) {
        if ([phoneDigits(a.phone), phoneDigits(a.father_phone)].includes(appDigits)) {
          errors.push('This phone number is already used on another application.');
          break;
        }
        if ([phoneDigits(a.phone), phoneDigits(a.father_phone)].includes(fatherDigits)) {
          errors.push("This father's phone number is already used on another application.");
          break;
        }
      }

      const files = req.files || {};
      if (!files.photo?.[0]) errors.push('Please upload a photograph.');
      if (!files.cnic_copy?.[0]) errors.push('Please upload the required ID document.');
      if (body.id_document_type === 'cnic' && !files.cnic_back?.[0]) {
        errors.push('Please upload the back of the CNIC.');
      }
      if (isBs && !files.domicile?.[0]) errors.push('Please upload the domicile for BS programs.');
      if (!files.marksheet?.[0]) errors.push('Please upload the marks sheet.');
      if (body.declaration !== 'true' && body.declaration !== 'on' && body.declaration !== '1') {
        errors.push('You must accept the declaration.');
      }

      if (errors.length) {
        const fieldMap = [
          [/full name/i, 'full_name'],
          [/father's name|father’s name/i, 'father_name'],
          [/mother's name|mother’s name/i, 'mother_name'],
          [/cnic \/ b-form|this cnic/i, 'cnic'],
          [/email/i, 'email'],
          [/father.*phone|father's phone|father’s phone/i, 'father_phone'],
          [/phone number is already|phone is required/i, 'phone'],
          [/photograph/i, 'photo'],
          [/id document|id front/i, 'cnic_copy'],
          [/back of the cnic/i, 'cnic_back'],
          [/domicile/i, 'domicile'],
          [/marks sheet|marksheet/i, 'marksheet'],
          [/declaration/i, 'declaration'],
        ];
        let field;
        for (const [re, key] of fieldMap) {
          if (re.test(errors[0])) { field = key; break; }
        }
        return res.status(422).json({ message: errors[0], errors, field });
      }
      const data = {
        application_id: await generateApplicationId(),
        full_name: body.full_name,
        date_of_birth: body.date_of_birth,
        cnic: body.cnic,
        id_document_type: body.id_document_type,
        gender: body.gender,
        religion: body.religion,
        nationality: body.nationality,
        address: body.address,
        province: isBs ? body.province : null,
        domicile_district: isBs ? body.domicile_district : null,
        district: isBs ? body.district : null,
        tehsil: isBs ? body.tehsil : null,
        phone: body.phone,
        email: String(body.email).toLowerCase(),
        father_name: body.father_name,
        father_cnic: body.father_cnic,
        father_occupation: body.father_occupation || '',
        father_phone: body.father_phone,
        mother_name: body.mother_name || '',
        mother_occupation: body.mother_occupation || '',
        previous_school: body.previous_school,
        board: body.board,
        grade: body.grade,
        marks_obtained: marks,
        total_marks: total,
        percentage: Math.round((marks / total) * 10000) / 100,
        program_id: program._id,
        photo_path: uploadPath(files.photo[0]),
        cnic_copy_path: uploadPath(files.cnic_copy[0]),
        cnic_back_path: files.cnic_back?.[0] ? uploadPath(files.cnic_back[0]) : undefined,
        domicile_path: files.domicile?.[0] ? uploadPath(files.domicile[0]) : undefined,
        marksheet_path: uploadPath(files.marksheet[0]),
        status: 'pending',
        submitted_at: new Date(),
      };

      const application = await Application.create(data);
      res.status(201).json({
        message: `Application submitted successfully. Your application ID is ${application.application_id}.`,
        application_id: application.application_id,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: e.message || 'Failed to submit application.' });
    }
  });
});

router.post('/status', async (req, res) => {
  const cnic = normalizeCnic(req.body.cnic);
  const applicationId = String(req.body.application_id || '').trim();
  if (!cnic) return res.status(422).json({ message: 'Please enter your CNIC / B-Form number.' });

  const query = { cnic };
  if (applicationId) query.application_id = applicationId;

  const application = await Application.findOne(query).populate('program_id');
  if (!application) {
    return res.status(404).json({ message: 'No application found for the details provided.' });
  }

  res.json({ application });
});

export default router;
