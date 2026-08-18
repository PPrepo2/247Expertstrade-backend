const mongoose = require('mongoose');

const withdrawSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'pending',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    wallet_address: {
        type: String,
    },
    paypal_email: {
        type: String,
    },
    bank_details: {
        bank_name: String,
        acct_name: String,
        acct_no: String,
        acct_swift: String,
    },
}, { timestamps: true });

const Withdraw = mongoose.model('Withdraw', withdrawSchema);

module.exports = Withdraw;