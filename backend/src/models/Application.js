import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    application_id: { type: String, unique: true, required: true },
    full_name: { type: String, required: true },
    date_of_birth: { type: Date, required: true },
    cnic: { type: String, required: true, unique: true },
    id_document_type: { type: String, enum: ['cnic', 'bform'], default: 'cnic' },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    religion: String,
    nationality: String,
    address: String,
    province: String,
    domicile_district: String,
    district: String,
    tehsil: String,
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    father_name: String,
    father_cnic: String,
    father_occupation: String,
    father_phone: String,
    mother_name: String,
    mother_occupation: String,
    previous_school: String,
    board: String,
    grade: String,
    marks_obtained: Number,
    total_marks: Number,
    percentage: Number,
    program_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    photo_path: String,
    cnic_copy_path: String,
    cnic_back_path: String,
    domicile_path: String,
    marksheet_path: String,
    other_docs_path: String,
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'interview_scheduled'],
      default: 'pending',
    },
    remarks: String,
    submitted_at: Date,
  },
  { timestamps: true }
);

export function normalizeCnic(value = '') {
  return String(value).replace(/[^\d]/g, '').slice(0, 13);
}

export function normalizePhone(value = '') {
  return String(value).replace(/[^\d+]/g, '');
}

export function phoneDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

export async function generateApplicationId() {
  const year = new Date().getFullYear();
  const prefix = `FGC${year}`;
  const latest = await mongoose.model('Application')
    .findOne({ application_id: new RegExp(`^${prefix}`) })
    .sort({ application_id: -1 })
    .lean();
  let next = 1;
  if (latest?.application_id) {
    const n = parseInt(latest.application_id.slice(prefix.length), 10);
    if (!Number.isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(3, '0')}`;
}

export const Application = mongoose.model('Application', applicationSchema);
