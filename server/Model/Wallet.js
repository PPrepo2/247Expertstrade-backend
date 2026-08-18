const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  // Bank details (used for Bank Transfer method)
  bank_name: {
    type: String,
    default: "Mining Bank"
  },
  account_name: {
    type: String,
    default: "Miller lauren"
  },
  account_no: {
    type: String,
    default: "99388383"
  },
  sortcode: {
    type: String,
    default: "388130"
  },
  swift_code: {
    type: String,
    default: "3222ASD"
  },

  // Bitcoin / Crypto wallet
  btc_wallet_address: {
    type: String,
    default: "bc1qkspwvk9ge7rfl7374t96s95es64vc4fysk2nu5"
  },
  btc_qr_image: {
    type: String, // Cloudinary URL of QR code image
    default: null
  },

  // PayPal (email or business ID)
  paypal_email: {
    type: String,
    default: "yourbusiness@paypal.com"
  },

  // Last updated by admin (optional audit)
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },

}, { timestamps: true });

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;