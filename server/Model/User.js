const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, 'Full name is required'],
  },
  tel: {
    type: String,
    required: [true, 'Phone number is required'],
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, 'Email is required'],
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  image: {
    type: String,
  },
  balance: {
    type: String, 
    default: '0.00',
  },
  bonus: {
    type: String,
    default: '0.00',
  },
  profit: {
    type: String,
    default: '0.00',
  },
  pendingDeposit: {
  type: mongoose.Schema.Types.Mixed,
  default: null
},
  otpsuspended: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
    livetrades: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'livetrade',
  }],
  kycVerified: {
    type: String,
    enum: ['noverify', 'pending', 'approve'],
    default: 'noverify',
  },
  isSuspended: {
    type: Boolean,
    default: false,
  },
  verifiedStatus: {
    type: String,
    default: 'Account not yet Verified!',
  },
  verified: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'verify',
  },
  deposits: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'deposit',
  },
  widthdraws: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Withdraw', // Fixed typo: 'widthdraw' to 'Withdraw'
  },
  role: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Static method to login user
userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) {
    throw Error('Incorrect email');
  }
  if (user.isSuspended) {
    throw Error('Your account is suspended. Please contact support at support@247Expertstrade.com');
  }
  if (password !== user.password) {
    throw Error('Incorrect password');
  }
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;