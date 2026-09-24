import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js';
import { Program } from './models/Program.js';
import { Content } from './models/Content.js';
import { Application } from './models/Application.js';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fatima_girls_college';

async function seed() {
  await mongoose.connect(uri);
  await Promise.all([
    User.deleteMany({}),
    Program.deleteMany({}),
    Content.deleteMany({}),
    Application.deleteMany({}),
  ]);

  await User.create({
    name: 'College Admin',
    email: 'admin@fatimagirlscollege.edu.pk',
    password: await bcrypt.hash('password', 10),
    role: 'admin',
  });

  const programs = await Program.insertMany([
    { name: 'F.A (Faculty of Arts)', code: 'FA', description: 'Faculty of Arts - 2 year program', duration_years: 2, capacity: 50, eligibility_criteria: 'Matriculation with minimum 60% marks', fee_per_year: 15000, is_active: true },
    { name: 'F.Sc Pre-Medical', code: 'FSC_PM', description: 'Faculty of Science Pre-Medical - 2 year program', duration_years: 2, capacity: 40, eligibility_criteria: 'Matric Science with minimum 65% marks', fee_per_year: 20000, is_active: true },
    { name: 'F.Sc Pre-Engineering', code: 'FSC_PE', description: 'Faculty of Science Pre-Engineering - 2 year program', duration_years: 2, capacity: 40, eligibility_criteria: 'Matric Science with minimum 65% marks', fee_per_year: 20000, is_active: true },
    { name: 'ICS', code: 'ICS', description: 'Intermediate in Computer Science - 2 year program', duration_years: 2, capacity: 35, eligibility_criteria: 'Matric with minimum 60% marks', fee_per_year: 18000, is_active: true },
    { name: 'ICOM', code: 'ICOM', description: 'Intermediate in Commerce - 2 year program', duration_years: 2, capacity: 45, eligibility_criteria: 'Matric with minimum 60% marks', fee_per_year: 16000, is_active: true },
    { name: 'BS Computer Science', code: 'BSCS', description: 'Bachelor of Science in Computer Science - 4 year program', duration_years: 4, capacity: 30, eligibility_criteria: 'Intermediate with minimum 50% marks', fee_per_year: 35000, is_active: true },
  ]);

  await Content.insertMany([
    { type: 'announcement', title: 'Admission Open for 2026', content: 'Applications are now open for all programs. Apply before the deadline.', is_active: true, published_at: new Date() },
    { type: 'announcement', title: 'New Campus Facilities', content: 'Exciting updates on our new library and computer labs.', is_active: true, published_at: new Date(Date.now() - 2 * 86400000) },
    { type: 'vision', title: 'Our Vision', content: 'To be a leading institution that empowers young women with quality education, fostering their intellectual, social, and personal development in a supportive and inclusive environment.', is_active: true },
    { type: 'mission', title: 'Our Mission', content: 'We are committed to providing comprehensive education that combines academic excellence with character building, preparing our students to become confident, responsible, and successful individuals who contribute positively to society.', is_active: true },
    { type: 'history', title: 'Our History', content: "Founded in 1995, Fatima Girls College has been a cornerstone of women's education in the region. Starting with a modest enrollment of 150 students, we have grown to serve over 2000 students annually across various programs.", is_active: true },
    { type: 'principal_message', title: "Principal's Message", content: '"At Fatima Girls College, we believe in nurturing the potential of every student. Our dedicated faculty and modern facilities create an environment where girls can thrive academically and personally." - Dr. Ayesha Khan, Principal', is_active: true },
    { type: 'admission_schedule', title: 'Admission Schedule', content: 'Admission applications open: January 1. Last date for submission: March 31. Entrance test: April 15. Results announcement: May 1.', is_active: true },
    { type: 'eligibility_criteria', title: 'Eligibility Criteria', content: 'For FA/FSC: Matriculation with minimum 60% marks. For ICS: Matric Science with minimum 65% marks. For ICOM: Matric with minimum 60% marks. For BS: Intermediate with minimum 50% marks.', is_active: true },
    { type: 'required_documents', title: 'Required Documents', content: '1. Matriculation certificate. 2. Intermediate mark sheet (for BS). 3. CNIC copy. 4. Passport size photos (4). 5. Medical certificate.', is_active: true },
    { type: 'admission_guidelines', title: 'Admission Guidelines', content: 'All applications must be submitted online. Incomplete applications will not be considered. Admission is based on merit and entrance test performance.', is_active: true },
    { type: 'admission_status', title: 'Admission Status', content: 'open', is_active: true },
    { type: 'contact', title: 'Contact Details', content: 'Address: Opposite to Molana Muhammad Zakir Degree College, Aminpur Bangla. Phone: 0321 4251905. Email: fgcollege86@gmail.com', is_active: true },
  ]);

  await Application.create([
    {
      application_id: 'FGC2026001',
      full_name: 'Ayesha Khan',
      date_of_birth: '2006-05-12',
      cnic: '3520212345671',
      id_document_type: 'cnic',
      gender: 'Female',
      religion: 'Islam',
      nationality: 'Pakistani',
      address: 'Aminpur Bangla',
      phone: '03001234567',
      email: 'ayesha.demo@example.com',
      father_name: 'Muhammad Khan',
      father_cnic: '3520212345672',
      father_phone: '03007654321',
      previous_school: 'City Girls High School',
      board: 'BISE Faisalabad',
      grade: 'Matric',
      marks_obtained: 850,
      total_marks: 1100,
      percentage: 77.27,
      program_id: programs[1]._id,
      status: 'pending',
      submitted_at: new Date(),
    },
    {
      application_id: 'FGC2026002',
      full_name: 'Fatima Ali',
      date_of_birth: '2005-08-20',
      cnic: '3520298765431',
      id_document_type: 'cnic',
      gender: 'Female',
      religion: 'Islam',
      nationality: 'Pakistani',
      address: 'Chiniot',
      phone: '03011112222',
      email: 'fatima.demo@example.com',
      father_name: 'Ali Raza',
      father_cnic: '3520298765432',
      father_phone: '03013334444',
      previous_school: 'District Public School',
      board: 'BISE Faisalabad',
      grade: 'Matric',
      marks_obtained: 920,
      total_marks: 1100,
      percentage: 83.64,
      program_id: programs[0]._id,
      status: 'approved',
      submitted_at: new Date(),
    },
    {
      application_id: 'FGC2026003',
      full_name: 'Sana Malik',
      date_of_birth: '2006-01-03',
      cnic: '3520211122233',
      id_document_type: 'bform',
      gender: 'Female',
      religion: 'Islam',
      nationality: 'Pakistani',
      address: 'Faisalabad',
      phone: '03015556666',
      email: 'sana.demo@example.com',
      father_name: 'Malik Imran',
      father_cnic: '3520211122234',
      father_phone: '03017778888',
      previous_school: 'Govt Girls High School',
      board: 'BISE Faisalabad',
      grade: 'Matric',
      marks_obtained: 700,
      total_marks: 1100,
      percentage: 63.64,
      program_id: programs[3]._id,
      status: 'rejected',
      remarks: 'Incomplete documents',
      submitted_at: new Date(),
    },
  ]);

  console.log('Seed complete. Admin: admin@fatimagirlscollege.edu.pk / password');
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
