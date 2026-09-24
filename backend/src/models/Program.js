import mongoose from 'mongoose';

const programSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: String,
    duration_years: { type: Number, default: 2 },
    capacity: { type: Number, default: 50 },
    eligibility_criteria: String,
    fee_per_year: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

programSchema.methods.isBsProgram = function isBsProgram() {
  const name = (this.name || '').toUpperCase();
  const code = (this.code || '').toUpperCase();
  return name.startsWith('BS') || code.startsWith('BS');
};

programSchema.virtual('formatted_fee').get(function formattedFee() {
  return `Rs ${Number(this.fee_per_year || 0).toLocaleString('en-PK')}`;
});

programSchema.set('toJSON', { virtuals: true });
programSchema.set('toObject', { virtuals: true });

export const Program = mongoose.model('Program', programSchema);
