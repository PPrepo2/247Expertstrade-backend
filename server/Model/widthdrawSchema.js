const mongoose = require('mongoose');

const withdrawSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['Bitcoin', 'Ethereum', 'CashApp', 'PayPal', 'USDT', 'Bank Transfer'],
    },
    walletAddress: {
        type: String,
        required: function() {
            return ['Bitcoin', 'Ethereum', 'USDT'].includes(this.type);
        },
    },
    cashAppTag: {
        type: String,
        required: function() {
            return this.type === 'CashApp';
        },
    },
    paypalEmail: {
        type: String,
        required: function() {
            return this.type === 'PayPal';
        },
    },
    bankDetails: {
        type: {
            bankName: { type: String, required: function() { return this.parent().type === 'Bank Transfer'; } },
            accountNumber: { type: String, required: function() { return this.parent().type === 'Bank Transfer'; } },
            country: { type: String, required: function() { return this.parent().type === 'Bank Transfer'; } },
            swiftCode: { type: String, required: function() { return this.parent().type === 'Bank Transfer'; } },
        },
        required: function() {
            return this.type === 'Bank Transfer';
        },
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'rejected'],
    },
    narration: {
        type: String,
        default: 'Narration',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
}, { timestamps: true });

const Withdraw = mongoose.model('withdraw', withdrawSchema);

module.exports = Withdraw;