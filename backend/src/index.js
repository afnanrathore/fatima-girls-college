import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import applicationRoutes from './routes/applications.js';
import adminRoutes from './routes/admin.js';
import { uploadsRoot } from './middleware/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 5000;

app.use(morgan('dev'));
app.use(cors({ origin: process.env.Frontend_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsRoot));

app.use('/api', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/apply', applicationRoutes);
app.use('/api/admin', adminRoutes);

const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next();
  });
});

async function start() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fatima_girls_college');
  console.log('MongoDB connected');
  app.listen(port, () => console.log(`API on http://localhost:${port}`));
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
