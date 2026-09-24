import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsRoot = path.join(__dirname, '../../uploads');

for (const dir of ['applications', 'gallery', 'selected_candidates']) {
  fs.mkdirSync(path.join(uploadsRoot, dir), { recursive: true });
}

function storageFor(subdir) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(uploadsRoot, subdir)),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  });
}

const fileFilter = (_req, file, cb) => {
  const ok = /jpeg|jpg|png|pdf/i.test(path.extname(file.originalname))
    || /jpeg|jpg|png|pdf/i.test(file.mimetype);
  cb(ok ? null : new Error('Only jpg, jpeg, png, pdf allowed'), ok);
};

export const applicationUpload = multer({
  storage: storageFor('applications'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

export const galleryUpload = multer({
  storage: storageFor('gallery'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

export const selectedPdfUpload = multer({
  storage: storageFor('selected_candidates'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});
