const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    default: 'Deposit'
  },
  amount: {
    type: String,
    required: true
  },
  payment_method: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'rejected']
  },
  image: {
    type: String
  },
  narration: {
    type: String,
    default: 'Payment'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const Deposit = mongoose.model('deposit', depositSchema);
module.exports = Deposit;