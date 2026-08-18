const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },

  // Documents
  document_type:   { type: String, required: true, enum: ["Int'l Passport", "National ID", "Drivers License"] },
  frontimg:        { type: String, required: [true, 'Front side image is required'] },
  backimg:         { type: String, required: [true, 'Back side image is required'] },
  photo:           { type: String, required: [true, 'Passport photograph is required'] },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'under review', 'approved', 'rejected', 'declined'],
    default: 'pending'
  },
  reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  reviewedAt:      { type: Date },
  rejectionReason: { type: String, trim: true },

}, { timestamps: true });

verificationSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Verification', verificationSchema);