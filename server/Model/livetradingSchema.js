const mongoose = require('mongoose');

const livetradeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    default: 'Turbo'
  },
  action: {
    type: String,
    required: true,
    enum: ['Call', 'Put']
  },
  currencypair: {
    type: String,
    required: true,
    default: 'EUR/USD'
  },
  amount: {
    type: String,
    required: true
  },
  lotsize: {
    type: String,
    default: '0.01'
  },
  entryPrice: {
    type: String,
    default: '0.00'
  },
  stopLoss: {
    type: String,
    default: '0.00'
  },
  takeProfit: {
    type: String,
    default: '0.00'
  },
  expiration: {
    type: String,
    default: '1min'
  },
  profitPercent: {
    type: String,
    default: '85'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'Closed', 'Won', 'Lost'],
    default: 'Open'
  }
}, { timestamps: true });

const Livetrading = mongoose.model('livetrade', livetradeSchema);
module.exports = Livetrading;