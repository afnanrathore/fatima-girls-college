import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, index: true },
    title: String,
    content: String,
    image_path: String,
    link: String,
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
    published_at: Date,
  },
  { timestamps: true }
);

contentSchema.virtual('url').get(function contentUrl() {
  if (!this.image_path) return null;
  if (this.image_path.startsWith('http')) return this.image_path;
  return `/uploads/${this.image_path.replace(/^\/+/, '')}`;
});

contentSchema.set('toJSON', { virtuals: true });
contentSchema.set('toObject', { virtuals: true });

export const Content = mongoose.model('Content', contentSchema);
