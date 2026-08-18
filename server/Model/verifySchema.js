const mongoose = require('mongoose');

const verifySchema = new mongoose.Schema(
  {
    document_type: {
      type: String,
      required: [true, 'Document type is required'],
    },
    image: {
      type: String,
      required: [true, 'Front page image is required'],
    },
    backImage: {
      type: String,
      required: [true, 'Back page image is required'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Changed from 'user' to 'User' to match the User model
      required: [true, 'User reference is required'],
    },
  },
  { timestamps: true }
);

const Verify = mongoose.model('verify', verifySchema);
module.exports = Verify;