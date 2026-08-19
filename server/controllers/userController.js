const mongoose = require('mongoose');
const User = require('../Model/User');
const Deposit = require('../Model/depositSchema');
const Livetrading = require('../Model/livetradingSchema')
const Wallet = require('../Model/Wallet');
const Verification = require('../Model/Verification');
const Withdraw = require('../Model/widthdrawSchema');
const crypto = require("crypto")
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const fsPromises = require('fs').promises;
const cloudinary = require('cloudinary').v2;
const { validationResult } = require('express-validator');
const moment = require('moment');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Generate verification URL dynamically
const generateVerificationUrl = (verificationToken) => {
  const apiBase = ( process.env.BACKEND_URL || 'https://swiftscapitals-backend.onrender.com').replace(/\/$/, '');
  return `${apiBase}/verify-email?user=${verificationToken}&ver_code=${verificationToken}`;
};

// Send welcome email using Resend
const sendWelcomeEmail = async (email, firstname,lastname, username, password, createdAt) => {
  const signInUrl = process.env.BASE_URL;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Support <support@swiftscapitals.com>',
      to: [email],
      subject: 'Welcome to  Swift Capital',
      html: `
        <div style="background-color: #1C2526; padding: 20px; font-family: Arial, sans-serif; color: #F5F6F5; text-align: center; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background-color: #2E3A3B; padding: 15px; border-bottom: 2px solid #F5F6F5;">
            <img src="https://swiftcaptial.com/assets/img/gkgr73S0C0AVl3XX0UUQh8Ffr0fmzCSK4EhmlcPQ.jpg" alt=" Swift Capital Logo" style="max-width: 150px; height: auto; display: block; margin: 0 auto;">
            <h2 style="color: #F5F6F5; margin: 10px 0 0; font-size: 24px;">Welcome, ${firstname}${lastname}</h2>
          </div>
          <!-- Body -->
          <div style="padding: 20px; font-size: 16px; line-height: 1.5;">
            <h3 style="color: #F5F6F5; font-size: 18px;">We are happy to have you join us</h3>
            <p style="color: #F5F6F5;">Your account registration and email verification was successful. Welcome to 247Expertstrade.</p>
            <p style="color: #F5F6F5; font-weight: bold;">Below is your personal details. Do not disclose to anyone.</p>
            <hr style="border: 1px solid #4A4A4A; margin: 20px 0;">
            <p style="color: #F5F6F5; text-align: left; margin: 10px 0;"><strong>Acc No:</strong> ${username}</p>
            <p style="color: #F5F6F5; text-align: left; margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            <p style="color: #F5F6F5; text-align: left; margin: 10px 0;"><strong>Password:</strong> ${password}</p>
            <hr style="border: 1px solid #4A4A4A; margin: 20px 0;">
            <a href="${signInUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3F3EED; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Sign In</a>
            <p style="color: #F5F6F5; font-size: 14px;">Account created on: ${new Date(createdAt).toLocaleDateString()}</p>
          </div>
          <!-- Footer -->
          <div style="background-color: #2E3A3B; padding: 15px; border-top: 2px solid #F5F6F5; font-size: 14px;">
            <p style="margin: 0 0 10px; color: #F5F6F5;">© ${new Date().getFullYear()} Capital Swift. All rights reserved.</p>
            <div style="display: flex; justify-content: center; gap: 20px;">
              <a href="mailto:support@swiftscapitals.com" style="color: #4A90E2; text-decoration: none; display: flex; align-items: center; gap: 5px;">
                <img src="https://img.icons8.com/ios-filled/24/4A90E2/email.png" alt="Email Icon" style="width: 20px; height: 20px;">
                <span>Contact Support</span>
              </a>
              <a href="#" style="color: #4A90E2; text-decoration: none; display: flex; align-items: center; gap: 5px;">
                <img src="https://img.icons8.com/ios-filled/24/4A90E2/globe.png" alt="Website Icon" style="width: 20px; height: 20px;">
                <span>Visit Website</span>
              </a>
            </div>
          </div>
        </div>
      `,
    });

    if (error) throw error;
    console.log('Welcome email sent successfully:', data.id);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw — verification already succeeded
  }
};


// Unified handleErrors function
const handleErrors = (err) => {
  let errors = {
    fullname: '',
    username: '',
    email: '',
    tel: '',
    country: '',
    zip_code: '',
    city: '',
    currency: '',
    password: '',
    address: ''
  };

  // Handle duplicate key errors (MongoDB error code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    if (field === 'email') {
      errors.email = 'That email is already registered';
    } else if (field === 'username') {
      errors.username = 'That username is already taken';
    } else if (field === 'fullname') {
      errors.fullname = 'That full name is already registered';
    }
    return errors;
  }

  // Handle Mongoose validation errors
  if (err.message.includes('user validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
    return errors;
  }

  // Handle login-specific errors
  if (err.message === 'incorrect email') {
    errors.email = 'Incorrect email';
  } else if (err.message === 'incorrect password') {
    errors.password = 'Incorrect password';
  } else if (err.message === 'Your account is not verified. Please verify it or create another account.') {
    errors.email = err.message;
  } else if (err.message === 'Your account is suspended. If you believe this is a mistake, please contact support at  c') {
    errors.email = err.message;
  }

  // Handle custom errors
  if (err.message === 'All fields are required') {
    errors.fullname = 'All fields are required';
  } else if (err.message === 'Passwords do not match') {
    errors.password = 'Passwords do not match';
  } else if (err.message === 'Invalid email format') {
    errors.email = 'Invalid email format';
  }

  // Handle Nodemailer errors
  if (err.message.includes('nodemailer') || err.message.includes('SMTP')) {
    errors.email = 'Failed to send email. Please try again later or contact support.';
  }

  // Handle generic errors
  if (Object.values(errors).every(val => val === '')) {
    errors.email = 'An unexpected error occurred. Please try again or contact support.';
  }

  return errors;
};

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, 'piuscandothis', { expiresIn: maxAge });
};

// ────────────────────────────────────────────────
// PUBLIC / MARKETING PAGES (no auth) – JSON only
// Frontend lives on Netlify; backend is API only
// ────────────────────────────────────────────────

const frontendUrl = () =>
  (process.env.FRONTEND_URL).replace(/\/$/, '');

module.exports.homePage = (req, res) => {
  return res.status(200).json({
    success: true,
    message: '247Expertstrade API is running',
    frontend: frontendUrl(),
    time: new Date().toISOString()
  });
};

module.exports.aboutPage = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend about page',
    redirect: `${frontendUrl()}/about.html`
  });
};

module.exports.InvestorPage = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend business page',
    redirect: `${frontendUrl()}/investors.html`
  });
};


module.exports.partnersPage = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend cards page',
    redirect: `${frontendUrl()}/partners.html`
  });
};


module.exports.contactPage = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend contact page',
    redirect: `${frontendUrl()}/contact.html`
  });
};


module.exports.faqPage = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend FAQ page',
    redirect: `${frontendUrl()}/faq.html`
  });
};


module.exports.termsPage = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend term page',
    redirect: `${frontendUrl()}/term.html`
  });
};

module.exports.registerPage = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend register page',
    redirect: `${frontendUrl()}/register.html`
  });
};

// GET /login – API only (browser UI is login.html on Netlify)
module.exports.loginPage = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend login page',
    redirect: `${frontendUrl()}/login.html`
  });
};


// ────────────────────────────────────────────────
// REGISTER – POST /register
// Accepts the original form fields from applicationform.html
// Maps them to the real User schema (fullname, tel, etc.)
// ────────────────────────────────────────────────
module.exports.register_post = async (req, res) => {
  console.log('========== REGISTER_POST START ==========');
  console.log('[REGISTER] Raw body keys:', Object.keys(req.body || {}));
  console.log('[REGISTER] Body (password hidden):', {
    ...req.body,
    pass: req.body?.pass ? '***' : undefined,
    cpass: req.body?.cpass ? '***' : undefined
  });

  // Original form fields
  const fname     = (req.body.fname || '').trim();
  const lname     = (req.body.lname || '').trim();
  const uname     = (req.body.uname || '').trim();
  const password  = req.body.pass || '';
  const cpass     = req.body.cpass || '';
  const title     = (req.body.title || '').trim();
  const phone     = (req.body.phone || '').trim();
  const email     = (req.body.email || '').trim().toLowerCase();
  const country   = (req.body.country || '').trim();
  const gender    = req.body.lev || '';
  const currency  = req.body.currency || 'USD $';

  try {
    // Required fields validation
    if (!fname || !lname || !uname || !email || !phone || !country || !password || !gender) {
      throw new Error('Please fill all required fields');
    }

    if (password !== cpass) {
      throw new Error('Passwords do not match');
    }

    // Build the data exactly matching your User schema
    const userData = {
      fullname: `${fname} ${lname}`.trim(),   // required by schema
      tel: phone,                             // required by schema
      email: email,
      country: country,
      gender: gender,
      password: password,                     // plain text for now (as in your current login method)
      balance: '0.00',
      bonus: '0.00',
      profit: '0.00',
      kycVerified: 'noverify',
      isSuspended: false,
      verifiedStatus: 'Account not yet Verified!'
    };

    console.log('[REGISTER] Creating user with schema fields:', {
      fullname: userData.fullname,
      tel: userData.tel,
      email: userData.email,
      country: userData.country,
      gender: userData.gender
    });

    const user = await User.create(userData);

    const token = createToken(user._id);

    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
      secure: true,
      sameSite: 'none'
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        tel: user.tel,
        account: user.account
      },
      redirect: 'dashboard.html'
    });

  } catch (err) {
    console.error('========== REGISTER_POST ERROR ==========');
    console.error(err);

    let errors = {};
    let errorMsg = err.message || 'Registration failed. Please try again.';

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      errors[field] = `This ${field} is already taken. Please choose another.`;
      errorMsg = errors[field];
    } else if (err.name === 'ValidationError') {
      Object.keys(err.errors || {}).forEach((key) => {
        errors[key] = err.errors[key].message;
      });
      errorMsg = Object.values(errors).join(' • ');
    }

    return res.status(400).json({
      success: false,
      errors,
      message: errorMsg
    });
  }
};


// ────────────────────────────────────────────────
// LOGIN – POST /login
// ────────────────────────────────────────────────
module.exports.login_post = async (req, res) => {
  console.log('========== LOGIN_POST START ==========');
  console.log('[LOGIN] Body:', {
    email: req.body?.email || null,
    hasPassword: !!req.body?.password
  });

  const { email, password } = req.body;

  try {
    if (!email || !password) {
      console.log('[LOGIN] FAIL – missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    console.log('[LOGIN] Step 1: User.login() for:', email.toLowerCase());
    const user = await User.login(email.toLowerCase(), password);
    console.log('[LOGIN] Step 1 OK – user found:', {
      _id: user._id,
      email: user.email,
      firstname: user.firstname,
      isVerified: user.isVerified,
      suspended: user.suspended
    });

    console.log('[LOGIN] Step 2: Create JWT');
    const token = createToken(user._id);
    console.log('[LOGIN] JWT created (length):', token ? token.length : 0);

    console.log('[LOGIN] Step 3: Set cookie');
    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
      secure: true,
      sameSite: 'none'
    });
    console.log('[LOGIN] Cookie set');

    let redirectUrl = 'dashboard.html';
    if (email.toLowerCase() === 'support@247expertstrade.com') {
      redirectUrl = 'adminDashboard.html';
      console.log('[LOGIN] Admin email detected → redirect:', redirectUrl);
    } else {
      console.log('[LOGIN] Normal user → redirect:', redirectUrl);
    }

    console.log('[LOGIN] SUCCESS – sending 200 JSON');
    console.log('========== LOGIN_POST END (success) ==========');

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.firstname || 'User'}!`,
      token,
      user: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        account_no: user.account_no
      },
      redirectUrl
    });

  } catch (err) {
    console.error('========== LOGIN_POST ERROR ==========');
    console.error('[LOGIN] err.message:', err.message);
    console.error('[LOGIN] err.stack:', err.stack);

    const errors = handleErrors(err);
    let errorMessage = err.message || 'Login failed. Please try again.';

    if (err.message === 'incorrect email') {
      errorMessage = 'Invalid email address.';
    } else if (err.message === 'incorrect password') {
      errorMessage = 'Invalid password.';
    } else if (err.message.includes('not verified')) {
      errorMessage = 'Your account is not verified. Please check your email.';
    } else if (err.message.includes('suspended')) {
      errorMessage = 'Your account is suspended. Contact support.';
    }

    console.log('[LOGIN] Response 400:', { message: errorMessage, errors });
    console.log('========== LOGIN_POST END (error) ==========');

    return res.status(400).json({
      success: false,
      message: errorMessage,
      errors
    });
  }
};


// OTP CODES

// OTP generation function
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// OTP sending function using Resend
const sendOTP = async (user) => {
    const otp = generateOTP(); // assuming you have this function defined
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = expires;
    await user.save();

    try {
        const { data, error } = await resend.emails.send({
            from: 'Experts Trade < support@swiftscapitals.com>', // Use your verified sender
            to: [user.email],
            subject: 'Withdraw Verification OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
                    <div style="text-align: center; padding: 10px 0;">
                        <h2 style="color: #1a1a1a;">Experts Trade</h2>
                    </div>
                    <div style="padding: 20px; background-color: #ffffff; border-radius: 8px; text-align: center;">
                        <h3 style="color: #333;">Transfer Verification Required</h3>
                        <p style="font-size: 16px; color: #555;">
                            Your One-Time Password (OTP) for the transfer is:
                        </p>
                        <div style="font-size: 32px; font-weight: bold; color: #0d6efd; letter-spacing: 8px; margin: 20px 0;">
                            ${otp}
                        </div>
                        <p style="font-size: 14px; color: #888;">
                            This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                        <p style="font-size: 12px; color: #aaa;">
                            If you didn't initiate this withdraw, please contact support immediately.
                        </p>
                    </div>
                    <div style="text-align: center; padding: 15px; font-size: 12px; color: #999;">
                        © ${new Date().getFullYear()} support@247expertstrade.com. All rights reserved.<br>
                        <a href="mailto: support@247expertstrade.com" style="color: #0d6efd; text-decoration: none;">support@247expertstrade.com</a>
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error('Resend OTP email error:', error);
            return false;
        }

        console.log('OTP email sent successfully via Resend:', data.id);
        return true;

    } catch (error) {
        console.error('Error sending OTP via Resend:', error);
        return false;
    }
};


module.exports.dashboardPage = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select('-password')
      .populate({
        path: 'livetrades',
        options: { sort: { createdAt: -1 }, limit: 20 }
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }

    // Also fetch latest open + closed trades if populate fails
    const livetrades = await Livetrading.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        tel: user.tel,
        balance: user.balance || '0.00',
        bonus: user.bonus || '0.00',
        profit: user.profit || '0.00',
        kycVerified: user.kycVerified || 'noverify',
        verifiedStatus: user.verifiedStatus,
        image: user.image || '',
        country: user.country,
        gender: user.gender,
        createdAt: user.createdAt
      },
      livetrades: livetrades || user.livetrades || []
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
};

// ====================== PLACE LIVE TRADE ======================
module.exports.placeLiveTrade = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const {
      type = 'Turbo',
      action,
      currencypair = 'EUR/USD',
      amount,
      expiration = '1min',
      profitPercent = '85'
    } = req.body;

    if (!action || !['Call', 'Put'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be Call or Put' });
    }

    const tradeAmount = Number(amount);
    if (!tradeAmount || tradeAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const currentBalance = Number(user.balance || 0);
    if (tradeAmount > currentBalance) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Deduct balance
    user.balance = (currentBalance - tradeAmount).toFixed(2);

    const newTrade = await Livetrading.create({
      type,
      action,
      currencypair,
      amount: tradeAmount.toFixed(2),
      lotsize: tradeAmount.toFixed(2),
      entryPrice: '0.00',
      stopLoss: '0.00',
      takeProfit: '0.00',
      expiration,
      profitPercent,
      status: 'Open',
      owner: userId
    });

    if (!user.livetrades) user.livetrades = [];
    user.livetrades.push(newTrade._id);
    await user.save();

    return res.status(201).json({
      success: true,
      message: `${action} trade placed successfully`,
      trade: newTrade,
      newBalance: user.balance
    });

  } catch (err) {
    console.error('Place trade error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to place trade'
    });
  }
};

module.exports.historyPage = async (req, res) => {
  try {
    const id = req.params.id;

    if (!req.user || req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const user = await User.findById(id)
      .select('fullname email balance profit bonus kycVerified currency image deposits widthdraws')
      .populate({
        path: 'deposits',
        model: 'deposit',
        options: { sort: { createdAt: -1 } }
      })
      .populate({
        path: 'widthdraws',
        model: 'withdraw',
        options: { sort: { createdAt: -1 } }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let deposits = user.deposits || [];
    let withdrawals = user.widthdraws || [];

    if (!deposits.length) {
      deposits = await Deposit.find({ owner: id }).sort({ createdAt: -1 }).lean();
    } else {
      deposits = deposits.map(d => (d.toObject ? d.toObject() : d));
    }

    if (!withdrawals.length) {
      withdrawals = await Withdraw.find({ owner: id }).sort({ createdAt: -1 }).lean();
    } else {
      withdrawals = withdrawals.map(w => (w.toObject ? w.toObject() : w));
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullname: user.fullname || '',
        email: user.email || '',
        balance: user.balance || '0.00',
        profit: user.profit || '0.00',
        bonus: user.bonus || '0.00',
        currency: user.currency || 'USD $',
        kycVerified: user.kycVerified || 'noverify',
        image: user.image || ''
      },
      deposits,
      withdrawals
    });
  } catch (error) {
    console.error('Account history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while loading transactions'
    });
  }
};

module.exports.tradeHistoryPage = async (req, res) => {
  try {
    const id = req.params.id;

    if (!req.user || req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const user = await User.findById(id)
      .select('fullname email balance profit bonus kycVerified currency image livetrades')
      .populate({
        path: 'livetrades',
        model: 'livetrade',
        options: { sort: { createdAt: -1 } }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Also fetch by owner in case some trades are not in user.livetrades array
    let trades = [];
    try {
      trades = await Livetrading.find({ owner: id }).sort({ createdAt: -1 }).lean();
    } catch (e) {
      trades = (user.livetrades || []).map(t => (t.toObject ? t.toObject() : t));
    }

    // Prefer populated array if query model path failed
    if ((!trades || trades.length === 0) && user.livetrades && user.livetrades.length) {
      trades = user.livetrades.map(t => (t.toObject ? t.toObject() : t));
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullname: user.fullname || '',
        email: user.email || '',
        balance: user.balance || '0.00',
        profit: user.profit || '0.00',
        bonus: user.bonus || '0.00',
        currency: user.currency || 'USD $',
        kycVerified: user.kycVerified || 'noverify',
        image: user.image || ''
      },
      trades: trades || []
    });
  } catch (error) {
    console.error('trade history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while loading trading history'
    });
  }
};



// ====================== DEPOSIT CONTROLLERS ======================

// ────────────────────────────────────────────────
// GET /deposits
// ────────────────────────────────────────────────
module.exports.depositsPage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'fullname firstname lastname  email currency balance profit bonus  image kycVerified'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullname: user.fullname || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email,
        currency: user.currency || 'USD $',
        balance: Number(user.balance || 0),
        profit: Number(user.profit || 0),
        bonus: Number(user.bonus || 0),
        image: user.image,
        kycVerified: user.kycVerified || false
      }
    });
  } catch (err) {
    console.error('depositsPage error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load deposits page' });
  }
};



// ────────────────────────────────────────────────
// POST /deposit/:id
// ────────────────────────────────────────────────
module.exports.deposit_post = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const amount = req.body.amount;
    const payment_method = req.body.payment_method || req.body.method;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    if (!payment_method || payment_method === 'Select Deposit Type *') {
      return res.status(400).json({ success: false, message: 'Please select a payment method' });
    }

    const pending = {
      amount: Number(amount),
      payment_method: String(payment_method).trim().toUpperCase(),
      createdAt: new Date()
    };

    if (req.session) req.session.pendingDeposit = pending;
    user.pendingDeposit = pending;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Proceed to payment',
      redirect: `payment.html?id=${user._id}`
    });
  } catch (err) {
    console.error('deposit_post error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process deposit request' });
  }
};

// ────────────────────────────────────────────────
// GET /payment  or  GET /payment/:id
// ────────────────────────────────────────────────
module.exports.paymentPage = async (req, res) => {
  try {
    const userId = req.user?._id || req.params.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId).select(
      'fullname firstname lastname  email  currency balance profit bonus  image pendingDeposit kycVerified'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const pending = (req.session && req.session.pendingDeposit) || user.pendingDeposit;
    if (!pending || !pending.amount || !pending.payment_method) {
      return res.status(400).json({
        success: false,
        message: 'No pending deposit found. Please start a new deposit.',
        redirect: 'funding.html'
      });
    }

    let wallet = {};
    try {
      const walletDoc = await Wallet.findOne().lean();
      if (walletDoc) wallet = walletDoc;
    } catch (e) {
      console.warn('Could not load wallet:', e.message);
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullname: user.fullname || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
        email: user.email,
        currency: user.currency || 'USD $',
        balance: Number(user.balance || 0),
        profit: Number(user.profit || 0),
        bonus: Number(user.bonus || 0),
        kycVerified: user.kycVerified || false
      },
      amount: pending.amount,
      payment_method: pending.payment_method,
      wallet: {
        bank_name: wallet.bank_name || '',
        account_name: wallet.account_name || '',
        account_no: wallet.account_no || '',
        sortcode: wallet.sortcode || '',
        swift_code: wallet.swift_code || '',
        btc_wallet_address: wallet.btc_wallet_address || '',
        btc_qr_image: wallet.btc_qr_image || '',
        paypal_email: wallet.paypal_email || ''
      }
    });
  } catch (err) {
    console.error('paymentPage error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to load payment page' });
  }
};

// ────────────────────────────────────────────────
// POST /deposit/confirm/:id
// ────────────────────────────────────────────────
module.exports.depositConfirm = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const amount = Number(req.body.amount);
    const payment_method = req.body.payment_method || req.body.method;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid deposit amount' });
    }
    if (!payment_method) {
      return res.status(400).json({ success: false, message: 'Payment method is required' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload proof of payment (image or PDF)' });
    }

    const imagePath = req.file.path || req.file.filename || (req.file.secure_url) || '';

    const newDeposit = new Deposit({
      owner: user._id,
      amount: String(amount),
      payment_method: String(payment_method).trim().toUpperCase(),
      image: imagePath,
      status: 'pending',
      type: 'Deposit',
      narration: `Payment via ${payment_method}`
    });

    await newDeposit.save();

    if (!user.deposits) user.deposits = [];
    user.deposits.push(newDeposit._id);
    user.pendingDeposit = undefined;
    if (req.session) delete req.session.pendingDeposit;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Payment proof submitted successfully. Your deposit is now pending approval.',
      redirect: 'funding.html'
    });
  } catch (err) {
    console.error('Deposit confirm error:', err);
    if (req.file && req.file.path) {
      try { require('fs').unlink(req.file.path, () => {}); } catch (e) {}
    }
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to submit payment proof. Please try again.'
    });
  }
};


// GET /withdraw – user balance + profile for withdraw pages
module.exports.withdrawPage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'fullname email balance profit bonus kycVerified currency image otpsuspended'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullname: user.fullname || '',
        email: user.email || '',
        balance: user.balance || '0.00',
        profit: user.profit || '0.00',
        bonus: user.bonus || '0.00',
        currency: user.currency || 'USD $',
        kycVerified: user.kycVerified || 'noverify',
        image: user.image || '',
        otpsuspended: !!user.otpsuspended
      }
    });
  } catch (err) {
    console.error('withdrawPage error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load withdraw page' });
  }
};

// POST /withdraw/init/:id – validate amount only (optional server check)
module.exports.withdrawInit = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const amount = Number(req.body.amount);
    const type = req.body.type;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    }
    if (!type) {
      return res.status(400).json({ success: false, message: 'Select a withdrawal method' });
    }

    const balance = Number(user.balance || 0);
    if (amount > balance) {
      return res.status(400).json({ success: false, message: 'Insufficient balance for withdrawal' });
    }

    return res.status(200).json({
      success: true,
      message: 'Withdrawal initiated',
      amount,
      type,
      fees: '0.00',
      balance
    });
  } catch (err) {
    console.error('withdrawInit error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed' });
  }
};

// POST /withdraw/send-otp/:id
module.exports.withdrawSendOtp = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (user.otpsuspended === true) {
      return res.status(403).json({
        success: false,
        message: 'You cannot withdraw now because you have not met all withdrawal requirements. Contact support.'
      });
    }

    const amount = Number(req.body.amount);
    const balance = Number(user.balance || 0);
    if (!amount || amount <= 0 || amount > balance) {
      return res.status(400).json({ success: false, message: 'Invalid amount or insufficient balance' });
    }

    const sent = await sendOTP(user);
    if (!sent) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP. Try again later.' });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email'
    });
  } catch (err) {
    console.error('withdrawSendOtp error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to send OTP' });
  }
};

// POST /withdraw/confirm/:id – verify OTP + create withdraw + deduct balance
module.exports.withdrawConfirm = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (user.otpsuspended === true) {
      return res.status(403).json({
        success: false,
        message: 'You cannot withdraw now because you have not met all withdrawal requirements.'
      });
    }

    const {
      otp,
      amount,
      type,
      narration,
      walletAddress,
      cashAppTag,
      paypalEmail,
      bankName,
      accountNumber,
      country,
      swiftCode
    } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }
    if (!user.otp || user.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    if (user.otpExpires && new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Request a new one.' });
    }

    const withdrawalAmount = Number(amount);
    const balance = Number(user.balance || 0);
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    if (withdrawalAmount > balance) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const allowed = ['Bitcoin', 'Ethereum', 'CashApp', 'PayPal', 'USDT', 'Bank Transfer'];
    if (!allowed.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal method' });
    }

    const withdrawData = {
      amount: withdrawalAmount,
      type,
      narration: narration || 'Withdrawal',
      owner: user._id,
      status: 'pending'
    };

    if (type === 'Bitcoin' || type === 'Ethereum' || type === 'USDT') {
      if (!walletAddress) {
        return res.status(400).json({ success: false, message: 'Wallet address is required' });
      }
      withdrawData.walletAddress = walletAddress;
    } else if (type === 'CashApp') {
      if (!cashAppTag) {
        return res.status(400).json({ success: false, message: 'CashApp tag is required' });
      }
      withdrawData.cashAppTag = cashAppTag;
    } else if (type === 'PayPal') {
      if (!paypalEmail) {
        return res.status(400).json({ success: false, message: 'PayPal email is required' });
      }
      withdrawData.paypalEmail = paypalEmail;
    } else if (type === 'Bank Transfer') {
      if (!bankName || !accountNumber || !country || !swiftCode) {
        return res.status(400).json({ success: false, message: 'All bank details are required' });
      }
      withdrawData.bankDetails = {
        bankName,
        accountNumber,
        country,
        swiftCode
      };
    }

    const withdrawal = new Withdraw(withdrawData);
    await withdrawal.save();

    user.balance = (balance - withdrawalAmount).toFixed(2);
    if (!user.widthdraws) user.widthdraws = [];
    user.widthdraws.push(withdrawal._id);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Withdrawal of $${withdrawalAmount.toFixed(2)} is successful and undergoing review.`,
      newBalance: user.balance,
      redirect: 'history.html'
    });
  } catch (err) {
    console.error('withdrawConfirm error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Error submitting withdrawal'
    });
  }
};


module.exports.verifyPage_post = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if there's already a pending / under review KYC
    if (user.kyc) {
      const existing = await Verification.findById(user.kyc);
      if (existing && ['pending', 'under review'].includes(existing.status)) {
        return res.status(400).json({
          success: false,
          message: 'You already have a KYC application under review. Please wait for the outcome.'
        });
      }
    }

    // ────────────────────────────────────────────────
    // Debug: log what multer actually received
    // You can remove this after testing
    console.log('Received files:', req.files);
    console.log('Received body:', req.body);
    // ────────────────────────────────────────────────

    const files = req.files || {};

    // Correct check when using upload.fields()
    if (!files.frontimg?.length || !files.backimg?.length || !files.photo?.length) {
      return res.status(400).json({
        success: false,
        message: 'All three images are required: frontimg, backimg, and photo'
      });
    }

    // Safe access — multer.fields() gives arrays
    const frontFile  = files.frontimg[0];
    const backFile   = files.backimg[0];
    const photoFile  = files.photo[0];

    // Upload images to Cloudinary
    const uploadOpts = { folder: 'swiftcapital/kyc', resource_type: 'image' };

    const [frontRes, backRes, photoRes] = await Promise.all([
      cloudinary.uploader.upload(frontFile.path, {
        ...uploadOpts,
        public_id: `kyc_front_${userId}_${Date.now()}`
      }),
      cloudinary.uploader.upload(backFile.path, {
        ...uploadOpts,
        public_id: `kyc_back_${userId}_${Date.now()}`
      }),
      cloudinary.uploader.upload(photoFile.path, {
        ...uploadOpts,
        public_id: `kyc_photo_${userId}_${Date.now()}`
      })
    ]);

    const verificationData = {
      user: userId,
      fullname:     req.body.name?.trim(),
      email:        req.body.email?.toLowerCase().trim(),
      tel:          req.body.phone?.trim(),
      title:        req.body.title,
      gender:       req.body.gender,
      zipcode:      req.body.zipcode?.trim(),
      dateofBirth:  req.body.dob ? new Date(req.body.dob) : null,

      statenumber:  req.body.statenumber?.trim(),
      accounttype:  req.body.accounttype,
      employer:     req.body.employer,
      income:       req.body.income,

      address:      req.body.address?.trim(),
      city:         req.body.city?.trim(),
      state:        req.body.state?.trim(),
      country:      req.body.country?.trim(),

      kinname:      req.body.kinname?.trim(),
      kinaddress:   req.body.kinaddress?.trim(),
      relationship: req.body.relationship?.trim(),
      age:          Number(req.body.age),

      document_type: req.body.document_type,
      frontimg:      frontRes.secure_url,
      backimg:       backRes.secure_url,
      photo:         photoRes.secure_url,

      status: 'pending'
    };

    const newVerification = new Verification(verificationData);
    await newVerification.save();

    // after newVerification.save()
     user.kycVerified = 'pending';
     user.verifiedStatus = 'KYC under review';
     if (!user.verified) user.verified = [];
     user.verified.push(newVerification._id);
     await user.save();

    return res.json({
      success: true,
      message: 'KYC application submitted successfully. Awaiting review.'
    });

  } catch (err) {
    console.error('KYC submission error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to submit KYC application. Please try again later.'
    });
  }
};


// GET /personal
module.exports.accountSettingsPage = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      'fullname tel email country gender image balance profit bonus kycVerified verifiedStatus createdAt'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let verification = null;
    try {
      verification = await Verification.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .lean();
    } catch (e) {
      console.warn('Verification lookup:', e.message);
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullname: user.fullname || '',
        tel: user.tel || '',
        email: user.email || '',
        country: user.country || '',
        gender: user.gender || '',
        image: user.image || '',
        balance: user.balance || '0.00',
        profit: user.profit || '0.00',
        bonus: user.bonus || '0.00',
        currency: 'USD $',
        kycVerified: user.kycVerified || 'noverify',
        verifiedStatus: user.verifiedStatus || 'Account not yet Verified!',
        createdAt: user.createdAt
      },
      verification: verification
        ? {
            _id: verification._id,
            status: verification.status,
            document_type: verification.document_type,
            createdAt: verification.createdAt,
            rejectionReason: verification.rejectionReason || ''
          }
        : null
    });
  } catch (err) {
    console.error('Account settings error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load account settings'
    });
  }
};

// POST /personal/:id  → update profile (only if KYC approved)
module.exports.updatePersonalData = async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.kycVerified !== 'approve') {
      return res.status(403).json({
        success: false,
        message: 'You can only edit personal data after KYC is approved.'
      });
    }

    const { fullname, tel, country, gender } = req.body;

    if (fullname !== undefined) user.fullname = String(fullname).trim();
    if (tel !== undefined) user.tel = String(tel).trim();
    if (country !== undefined) user.country = String(country).trim();
    if (gender !== undefined) user.gender = String(gender).trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Personal data updated successfully',
      user: {
        _id: user._id,
        fullname: user.fullname,
        tel: user.tel,
        email: user.email,
        country: user.country,
        gender: user.gender
      }
    });
  } catch (err) {
    console.error('updatePersonalData error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to update personal data'
    });
  }
};

// GET /security
module.exports.editPasswordPage = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select(
      'fullname email balance profit bonus kycVerified image'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullname: user.fullname || '',
        email: user.email || '',
        balance: user.balance || '0.00',
        profit: user.profit || '0.00',
        bonus: user.bonus || '0.00',
        currency: 'USD $',
        kycVerified: user.kycVerified || 'noverify',
        image: user.image || ''
      }
    });
  } catch (err) {
    console.error('Edit password page error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load security settings'
    });
  }
};

// POST /security/:id
module.exports.editPassword = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;

    if (req.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const current_password =
      req.body.current_password || req.body.current || '';
    const password = req.body.password || req.body.pass || '';
    const password_confirmation =
      req.body.password_confirmation || req.body.rpass || '';

    if (!current_password || !password || !password_confirmation) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    if (password !== password_confirmation) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Matches your User.login static method (plain-text passwords)
    if (current_password !== user.password) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    if (password === user.password) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from the current password'
      });
    }

    user.password = password;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again with your new password.'
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to change password'
    });
  }
};

module.exports.logout_get = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    maxAge: 1,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out',
    redirect: `${frontendUrl()}/login.html`
  });
};
