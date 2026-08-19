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

   btc_address: {
        type: String,
        lowercase: true,
        default: "gj762346yshshshkshkshksd"
    },
    btc_image: {
        type: String,
        default: null
    },
    eth_address: {
        type: String,
        lowercase: true,
        default: "gj762346yshshshkshkshksd"
    },
    eth_image: {
        type: String,
        default: null
    },
    usdt_address: {
        type: String,
        lowercase: true,
        default: "gj762346yshshshkshkshksd"
    },
    usdt_image: {
        type: String,
        default: null
    },
    cashapp: {
        type: String,
        lowercase: true,
        default: "$Bitcoin"
    },
    cashapp_image: {
        type: String,
        default: null
    },
    paypal: {
        type: String,
        lowercase: true,
        default: "example@gmail.com"
    },
    paypal_image: {
        type: String,
        default: null
    },

  // Last updated by admin (optional audit)
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },

}, { timestamps: true });

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;