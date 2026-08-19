
const jwt = require('jsonwebtoken')
const User = require('../Model/User');
const Deposit = require('../Model/depositSchema');
const Livetrading = require('../Model/livetradingSchema')
const Wallet = require('../Model/Wallet');
const Verification = require('../Model/Verification');
const Withdraw = require('../Model/widthdrawSchema'); // adjust path to your file
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: '', password: '', };

  // duplicate email error
  if (err.code === 11000) {
    errors.email = 'that email is already registered';
    return errors;
  }
  // validation errors
  if (err.message.includes('user validation failed')) {
    // console.log(err);
    Object.values(err.errors).forEach(({ properties }) => {
      // console.log(val);
      // console.log(properties);
      errors[properties.path] = properties.message;
    });
  }


  return errors;
}


const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, 'piuscandothis', {
    expiresIn: maxAge
  });
};


module.exports.loginAdmin_post = async(req, res) =>{
  try {
    const { email, password } = req.body;

    const user = await User.findOne({email: email});

    if(user){
    const passwordMatch = await (password, user.password);

    if (passwordMatch) {
      
      if(!user.role == "admin"){
        res.render('login', handleErrors('Email and password is incorrect') )
      }else{
        const token = createToken(user._id);
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.status(200).json({ user: user._id });
      }
      
    } else {
      res.render('login', handleErrors() )
    }
    } else{
      res.render('login',handleErrors() )
    }
    
  } catch (error) {
    console.log(error)
  }
    
}


// *******************ADMIN DASHBOARD CONTROLLERS *************************//

module.exports.adminPage = async (req, res) => {
  try {
    let perPage = 50;
    let page = parseInt(req.query.page) || 1;
    let sort = req.query.sort || 'createdAt';
    let order = req.query.order === 'asc' ? 1 : -1;
    let status = req.query.status || 'all';

    const query = {};
    if (status === 'active')   query.isSuspended = false;
    if (status === 'suspended') query.isSuspended = true;

    const users = await User.find(query)
      .sort({ [sort]: order })
      .skip(perPage * page - perPage)
      .limit(perPage)
      .lean();

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / perPage);

   return res.status(200).json({
  success: true,
  user: {
    _id: req.user._id,
    firstname: req.user.firstname,
    midname: req.user.midname,
    lastname: req.user.lastname,
    email: req.user.email,
    image: req.user.image
  },
  users,          // paginated list
  page: Number(page),
  totalPages,
  status: status || 'all'
});
  } catch (err) {
    console.error(err);
    res.render('adminDashboard', {
      users: [],
      page: 1,
      totalPages: 1,
      sort: 'createdAt',
      order: -1,
      status: 'all',
      error: 'Could not load users'
    });
  }
};


module.exports.viewUser = async (req, res) => {
  try {
    
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'deposits',
        model: 'deposit',
        options: { sort: { createdAt: -1 }, limit: 20 }
      })
      .populate({
        path: 'widthdraws',
        model: 'withdraw', // lowercase — matches your mongoose.model('withdraw', ...)
        options: { sort: { createdAt: -1 }, limit: 20 }
      })
      .populate({
        path: 'livetrades',
        model: 'livetrade',
        options: { sort: { createdAt: -1 }, limit: 20 }
      })
      .populate({
        path: 'verified',
        model: 'Verification', // matches mongoose.model('Verification', ...)
        options: { sort: { createdAt: -1 }, limit: 10 }
      })
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullname: user.fullname || '',
        email: user.email || '',
        tel: user.tel || '',
        country: user.country || '',
        gender: user.gender || '',
        image: user.image || '',
        balance: user.balance || '0.00',
        bonus: user.bonus || '0.00',
        profit: user.profit || '0.00',
        kycVerified: user.kycVerified || 'noverify',
        verifiedStatus: user.verifiedStatus || '',
        isSuspended: !!user.isSuspended,
        otpsuspended: !!user.otpsuspended,
        role: user.role,
        pendingDeposit: user.pendingDeposit || null,
        deposits: user.deposits || [],
        widthdraws: user.widthdraws || [],
        livetrades: user.livetrades || [],
        verified: user.verified || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      admin: {
        _id: req.user._id,
        fullname: req.user.fullname || '',
        email: req.user.email || '',
        image: req.user.image || ''
      }
    });
  } catch (err) {
    console.error('viewUser error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /editUser/:id
module.exports.editUserPage = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullname: user.fullname || '',
        email: user.email || '',
        tel: user.tel || '',
        country: user.country || '',
        gender: user.gender || '',
        balance: user.balance || '0.00',
        bonus: user.bonus || '0.00',
        profit: user.profit || '0.00',
        kycVerified: user.kycVerified || 'noverify',
        verifiedStatus: user.verifiedStatus || '',
        isSuspended: !!user.isSuspended,
        otpsuspended: !!user.otpsuspended,
        role: user.role,
        depositsCount: Array.isArray(user.deposits) ? user.deposits.length : 0,
        widthdrawsCount: Array.isArray(user.widthdraws) ? user.widthdraws.length : 0,
        livetradesCount: Array.isArray(user.livetrades) ? user.livetrades.length : 0,
        verifiedCount: Array.isArray(user.verified) ? user.verified.length : 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      admin: {
        _id: req.user._id,
        fullname: req.user.fullname || '',
        email: req.user.email || ''
      }
    });
  } catch (err) {
    console.error('editUserPage error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /editUser/:id
module.exports.editUser_post = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      fullname,
      email,
      tel,
      country,
      gender,
      balance,
      bonus,
      profit,
      kycVerified,
      verifiedStatus,
      isSuspended,
      otpsuspended,
      password
    } = req.body;

    if (fullname !== undefined) user.fullname = String(fullname).trim();
    if (email !== undefined) user.email = String(email).trim().toLowerCase();
    if (tel !== undefined) user.tel = String(tel).trim();
    if (country !== undefined) user.country = String(country).trim();
    if (gender !== undefined) user.gender = String(gender).trim();
    if (balance !== undefined) user.balance = String(balance);
    if (bonus !== undefined) user.bonus = String(bonus);
    if (profit !== undefined) user.profit = String(profit);
    if (verifiedStatus !== undefined) user.verifiedStatus = String(verifiedStatus);

    if (kycVerified !== undefined) {
      const allowed = ['noverify', 'pending', 'approve'];
      const k = String(kycVerified).toLowerCase();
      if (allowed.includes(k)) user.kycVerified = k;
    }

    if (isSuspended !== undefined) {
      user.isSuspended = isSuspended === true || isSuspended === 'true' || isSuspended === '1';
    }
    if (otpsuspended !== undefined) {
      user.otpsuspended = otpsuspended === true || otpsuspended === 'true' || otpsuspended === '1';
    }

    // Optional password change (plain text — matches your User.login)
    if (password && String(password).trim() !== '') {
      user.password = String(password).trim();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email
      }
    });
  } catch (err) {
    console.error('editUser_post error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

// Optional: generate OTP for user (if route exists)
module.exports.generateOtp = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    return res.status(200).json({ success: true, otp, message: 'OTP generated' });
  } catch (err) {
    console.error('generateOtp error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    // Send email via Resend (unchanged)
    const status = user.isSuspended ? 'suspended' : 'reactivated';

    await resend.emails.send({
      from: 'support@swiftscapitals.com',
      to: user.email,
      subject: `Account ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Account ${status}</h2>
          <p>Hello ${user.firstname || 'User'},</p>
          <p>Your account has been <strong>${status}</strong>.</p>
          ${
            user.isSuspended
              ? '<p style="color: #d32f2f;">If you believe this is a mistake, please contact support.</p>'
              : '<p>You can now log in and use all services again.</p>'
          }
          <hr>
          <p><strong>Email:</strong> ${user.email}</p>
          <p style="font-size: 0.9em; color: #777;">
            Status updated on ${new Date().toLocaleString()}
          </p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: `User ${status} successfully`,
      isSuspended: user.isSuspended
    });

  } catch (err) {
    console.error('Suspension error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update suspension status'
    });
  }
};

module.exports.deletePage = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

module.exports.suspendOTP = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { otpSuspended: true }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'OTP verification suspended for user',
      otpSuspended: true
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to suspend OTP'
    });
  }
};

module.exports.unsuspendOTP = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { otpSuspended: false }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'OTP verification re-enabled for user',
      otpSuspended: false
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to enable OTP'
    });
  }
};




// *******************ALL DEPOSITS CONTROLLERS *************************//

module.exports.allDeposit = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = Math.min(50, Math.max(5, parseInt(req.query.limit, 10) || 20));
    const status = (req.query.status || '').trim().toLowerCase();
    const search = (req.query.search || '').trim();

    const query = {};
    if (status && status !== 'all') {
      query.status = new RegExp('^' + status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
    }

    let deposits = await Deposit.find(query)
      .populate('owner', 'fullname email tel')
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .lean();

    if (search) {
      const s = search.toLowerCase();
      deposits = deposits.filter((d) => {
        const ownerName = d.owner && d.owner.fullname ? String(d.owner.fullname).toLowerCase() : '';
        const ownerEmail = d.owner && d.owner.email ? String(d.owner.email).toLowerCase() : '';
        return (
          ownerName.includes(s) ||
          ownerEmail.includes(s) ||
          String(d.type || '').toLowerCase().includes(s) ||
          String(d.amount || '').includes(s) ||
          String(d.narration || '').toLowerCase().includes(s) ||
          String(d._id).includes(s)
        );
      });
    }

    const total = await Deposit.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return res.status(200).json({
      success: true,
      deposits: deposits.map((d) => ({
        _id: d._id,
        type: d.type || 'Deposit',
        amount: d.amount != null ? String(d.amount) : '0',
        status: d.status || 'pending',
        narration: d.narration || 'Payment',
        image: d.image || null,
        payment_method: d.payment_method || d.type || '',
        owner: d.owner
          ? {
              _id: d.owner._id,
              fullname: d.owner.fullname || '',
              email: d.owner.email || '',
              tel: d.owner.tel || ''
            }
          : null,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      })),
      page,
      perPage,
      total,
      totalPages,
      admin: {
        _id: req.user._id,
        fullname: req.user.fullname || '',
        email: req.user.email || ''
      }
    });
  } catch (err) {
    console.error('allDeposit error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


// GET /editDeposit/:id  (or /viewDeposit/:id if you prefer)
module.exports.editDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id)
      .populate('owner', 'fullname email tel balance')
      .lean();

    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    return res.status(200).json({
      success: true,
      deposit: {
        _id: deposit._id,
        type: deposit.type || 'Deposit',
        amount: deposit.amount != null ? String(deposit.amount) : '0',
        status: deposit.status || 'pending',
        narration: deposit.narration || 'Payment',
        image: deposit.image || null,
        payment_method: deposit.payment_method || deposit.type || '',
        owner: deposit.owner
          ? {
              _id: deposit.owner._id,
              fullname: deposit.owner.fullname || '',
              email: deposit.owner.email || '',
              tel: deposit.owner.tel || '',
              balance: deposit.owner.balance || '0.00'
            }
          : null,
        createdAt: deposit.createdAt,
        updatedAt: deposit.updatedAt
      },
      admin: {
        _id: req.user._id,
        fullname: req.user.fullname || '',
        email: req.user.email || ''
      }
    });
  } catch (err) {
    console.error('editDeposit error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /editDeposit/:id
module.exports.editDeposit_post = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    const prevStatus = String(deposit.status || '').toLowerCase();
    const {
      type,
      amount,
      status,
      narration
    } = req.body;

    if (type !== undefined) deposit.type = String(type).trim();
    if (amount !== undefined) deposit.amount = String(amount);
    if (narration !== undefined) deposit.narration = String(narration);
    if (status !== undefined) deposit.status = String(status).toLowerCase();

    const newStatus = String(deposit.status || '').toLowerCase();

    // Credit user balance once when moving to approved/confirmed
    const wasApproved = prevStatus === 'approved' || prevStatus === 'confirmed';
    const nowApproved = newStatus === 'approved' || newStatus === 'confirmed';

    if (nowApproved && !wasApproved && deposit.owner) {
      const user = await User.findById(deposit.owner);
      if (user) {
        const currentBal = parseFloat(user.balance) || 0;
        const add = parseFloat(deposit.amount) || 0;
        user.balance = String((currentBal + add).toFixed(2));
        if (user.pendingDeposit && String(user.pendingDeposit) === String(deposit._id)) {
          user.pendingDeposit = null;
        }
        await user.save();
      }
    }

    await deposit.save();

    return res.status(200).json({
      success: true,
      message: 'Deposit updated successfully',
      deposit: {
        _id: deposit._id,
        type: deposit.type,
        amount: deposit.amount,
        status: deposit.status,
        narration: deposit.narration
      }
    });
  } catch (err) {
    console.error('editDeposit_post error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

module.exports.deleteDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    // Delete image from Cloudinary if it exists
    if (deposit.image && deposit.image.includes('cloudinary')) {
      const publicId = deposit.image.split('/').pop().split('.')[0]; // extract public_id
      await cloudinary.uploader.destroy(`deposits/${publicId}`); // adjust folder if needed
    }

    await Deposit.deleteOne({ _id: req.params.id });

    return res.status(200).json({
      success: true,
      message: 'Deposit deleted successfully'
    });
  } catch (error) {
    console.error('Delete deposit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete deposit'
    });
  }
};

// *******************ALL LIVETRADES ***********************************

// Fetch all live trades
// GET /all-livetrade
module.exports.getAllTrades = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = Math.min(50, Math.max(5, parseInt(req.query.limit, 10) || 20));
    const status = (req.query.status || '').trim();
    const search = (req.query.search || '').trim();
    const sortField = ['type', 'action', 'currencypair', 'amount', 'status', 'createdAt'].includes(req.query.sort)
      ? req.query.sort
      : 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    const query = {};
    if (status && status !== 'all') {
      query.status = new RegExp('^' + status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
    }

    let trades = await Livetrading.find(query)
      .populate({
        path: 'owner',
        model: 'User',
        select: 'fullname email tel'
      })
      .sort({ [sortField]: order })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .lean();

    if (search) {
      const s = search.toLowerCase();
      trades = trades.filter((t) => {
        const name = t.owner?.fullname ? String(t.owner.fullname).toLowerCase() : '';
        const email = t.owner?.email ? String(t.owner.email).toLowerCase() : '';
        return (
          name.includes(s) ||
          email.includes(s) ||
          String(t.type || '').toLowerCase().includes(s) ||
          String(t.currencypair || '').toLowerCase().includes(s) ||
          String(t.action || '').toLowerCase().includes(s) ||
          String(t.amount || '').includes(s) ||
          String(t._id).includes(s)
        );
      });
    }

    const total = await Livetrading.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return res.status(200).json({
      success: true,
      trades: trades.map((t) => ({
        _id: t._id,
        type: t.type || '',
        action: t.action || '',
        currencypair: t.currencypair || '',
        amount: t.amount != null ? String(t.amount) : '0',
        lotsize: t.lotsize || '0.01',
        entryPrice: t.entryPrice || '0.00',
        stopLoss: t.stopLoss || '0.00',
        takeProfit: t.takeProfit || '0.00',
        expiration: t.expiration || '',
        profitPercent: t.profitPercent || '85',
        status: t.status || 'Open',
        owner: t.owner
          ? {
              _id: t.owner._id,
              fullname: t.owner.fullname || '',
              email: t.owner.email || '',
              tel: t.owner.tel || ''
            }
          : null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      })),
      page,
      perPage,
      total,
      totalPages,
      sort: sortField,
      order: order === 1 ? 'asc' : 'desc',
      admin: {
        _id: req.user._id,
        fullname: req.user.fullname || '',
        email: req.user.email || ''
      }
    });
  } catch (err) {
    console.error('getAllTrades error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


// View a single trade
// GET /trades-view/:id  (optional detail)
module.exports.viewTrade = async (req, res) => {
  try {
    const trade = await Livetrading.findById(req.params.id)
      .populate({ path: 'owner', model: 'User', select: 'fullname email tel' })
      .lean();

    if (!trade) {
      return res.status(404).json({ success: false, message: 'Trade not found' });
    }

    return res.status(200).json({
      success: true,
      trade,
      admin: {
        _id: req.user._id,
        fullname: req.user.fullname || '',
        email: req.user.email || ''
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /trades-edit/:id
module.exports.editTrade = async (req, res) => {
  try {
    const livetrade = await Livetrading.findById(req.params.id)
      .populate({
        path: 'owner',
        model: 'User',
        select: 'fullname email'
      })
      .lean();

    if (!livetrade) {
      return res.status(404).json({ success: false, message: 'Trade not found' });
    }

    return res.status(200).json({
      success: true,
      trade: {
        _id: livetrade._id,
        type: livetrade.type || 'Turbo',
        action: livetrade.action || 'Call',
        currencypair: livetrade.currencypair || '',
        amount: livetrade.amount || '0',
        lotsize: livetrade.lotsize || '0.01',
        entryPrice: livetrade.entryPrice || '0.00',
        stopLoss: livetrade.stopLoss || '0.00',
        takeProfit: livetrade.takeProfit || '0.00',
        expiration: livetrade.expiration || '1min',
        profitPercent: livetrade.profitPercent || '85',
        status: livetrade.status || 'Open',
        owner: livetrade.owner
          ? {
              _id: livetrade.owner._id,
              fullname: livetrade.owner.fullname || '',
              email: livetrade.owner.email || ''
            }
          : null,
        createdAt: livetrade.createdAt,
        updatedAt: livetrade.updatedAt
      },
      admin: {
        _id: req.user._id,
        fullname: req.user.fullname || '',
        email: req.user.email || ''
      }
    });
  } catch (err) {
    console.error('editTrade error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /trades-edit/:id
module.exports.updateTrade = async (req, res) => {
  try {
    const {
      type,
      action,
      currencypair,
      amount,
      lotsize,
      entryPrice,
      stopLoss,
      takeProfit,
      expiration,
      profitPercent,
      status
    } = req.body;

    const livetrade = await Livetrading.findById(req.params.id);
    if (!livetrade) {
      return res.status(404).json({ success: false, message: 'Trade not found' });
    }

    // Basic validation
    if (!currencypair) {
      return res.status(400).json({ success: false, message: 'Currency pair is required' });
    }
    if (!['Call', 'Put'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action (must be Call or Put)' });
    }
    if (!['Open', 'Closed', 'Won', 'Lost'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Update fields
    if (type !== undefined) livetrade.type = type;
    if (action !== undefined) livetrade.action = action;
    if (currencypair !== undefined) livetrade.currencypair = currencypair;
    if (amount !== undefined) livetrade.amount = String(amount);
    if (lotsize !== undefined) livetrade.lotsize = String(lotsize);
    if (entryPrice !== undefined) livetrade.entryPrice = String(entryPrice);
    if (stopLoss !== undefined) livetrade.stopLoss = String(stopLoss);
    if (takeProfit !== undefined) livetrade.takeProfit = String(takeProfit);
    if (expiration !== undefined) livetrade.expiration = expiration;
    if (profitPercent !== undefined) livetrade.profitPercent = String(profitPercent);
    if (status !== undefined) livetrade.status = status;

    await livetrade.save();

    return res.status(200).json({
      success: true,
      message: 'Trade updated successfully',
      trade: {
        _id: livetrade._id,
        type: livetrade.type,
        action: livetrade.action,
        currencypair: livetrade.currencypair,
        status: livetrade.status
      }
    });
  } catch (err) {
    console.error('updateTrade error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Error updating trade'
    });
  }
};

// DELETE /trades-delete/:id
module.exports.deleteTrade = async (req, res) => {
  try {
    const trade = await Livetrading.findById(req.params.id);
    if (!trade) {
      return res.status(404).json({ success: false, message: 'Trade not found' });
    }

    // Remove from user's livetrades array
    await User.updateOne(
      { _id: trade.owner },
      { $pull: { livetrades: trade._id } }
    );

    await Livetrading.deleteOne({ _id: trade._id });

    return res.status(200).json({
      success: true,
      message: 'Trade deleted successfully'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error deleting trade' });
  }
};


// ******************************ALL WITHDRAWALS ***********************************


module.exports.allWithdrawals = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = Math.min(50, Math.max(5, parseInt(req.query.limit, 10) || 20));
    const status = (req.query.status || '').trim().toLowerCase();
    const search = (req.query.search || '').trim();
    const sortField = ['amount', 'type', 'status', 'createdAt', 'updatedAt'].includes(req.query.sort)
      ? req.query.sort
      : 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    const query = {};
    if (status && status !== 'all') {
      query.status = new RegExp('^' + status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
    }

    // model: 'User' must match: mongoose.model('User', userSchema)
    let withdrawals = await Withdraw.find(query)
      .populate({
        path: 'owner',
        model: 'User',
        select: 'fullname email tel'
      })
      .sort({ [sortField]: order })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .lean();

    if (search) {
      const s = search.toLowerCase();
      withdrawals = withdrawals.filter((w) => {
        const name = w.owner && w.owner.fullname ? String(w.owner.fullname).toLowerCase() : '';
        const email = w.owner && w.owner.email ? String(w.owner.email).toLowerCase() : '';
        return (
          name.includes(s) ||
          email.includes(s) ||
          String(w.type || '').toLowerCase().includes(s) ||
          String(w.amount || '').includes(s) ||
          String(w.walletAddress || '').toLowerCase().includes(s) ||
          String(w._id).includes(s)
        );
      });
    }

    const total = await Withdraw.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return res.status(200).json({
      success: true,
      withdrawals: withdrawals.map((w) => ({
        _id: w._id,
        amount: w.amount != null ? String(w.amount) : '0',
        type: w.type || '',
        status: w.status || 'pending',
        narration: w.narration || '',
        walletAddress: w.walletAddress || '',
        cashAppTag: w.cashAppTag || '',
        paypalEmail: w.paypalEmail || '',
        bankDetails: w.bankDetails || null,
        owner: w.owner
          ? {
              _id: w.owner._id,
              fullname: w.owner.fullname || '',
              email: w.owner.email || '',
              tel: w.owner.tel || ''
            }
          : null,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt
      })),
      page,
      perPage,
      total,
      totalPages,
      sort: sortField,
      order: order === 1 ? 'asc' : 'desc',
      admin: {
        _id: req.user._id,
        fullname: req.user.fullname || '',
        email: req.user.email || ''
      }
    });
  } catch (err) {
    console.error('allWithdrawals error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


// GET /withdrawals-edit/:id  OR  GET /editWithdrawal/:id
module.exports.editWithdrawalPage = async (req, res) => {
  try {
    const withdrawal = await Withdraw.findById(req.params.id)
      .populate({
        path: 'owner',
        model: 'User',
        select: 'fullname email tel balance'
      })
      .lean();

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    return res.status(200).json({
      success: true,
      withdrawal: {
        _id: withdrawal._id,
        amount: withdrawal.amount != null ? String(withdrawal.amount) : '0',
        type: withdrawal.type || '',
        status: withdrawal.status || 'pending',
        narration: withdrawal.narration || '',
        walletAddress: withdrawal.walletAddress || '',
        cashAppTag: withdrawal.cashAppTag || '',
        paypalEmail: withdrawal.paypalEmail || '',
        bankDetails: withdrawal.bankDetails || {
          bankName: '',
          accountNumber: '',
          country: '',
          swiftCode: ''
        },
        owner: withdrawal.owner
          ? {
              _id: withdrawal.owner._id,
              fullname: withdrawal.owner.fullname || '',
              email: withdrawal.owner.email || '',
              tel: withdrawal.owner.tel || '',
              balance: withdrawal.owner.balance || '0.00'
            }
          : null,
        createdAt: withdrawal.createdAt,
        updatedAt: withdrawal.updatedAt
      },
      admin: {
        _id: req.user._id,
        fullname: req.user.fullname || '',
        email: req.user.email || ''
      }
    });
  } catch (err) {
    console.error('editWithdrawalPage error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /withdrawals-edit/:id  OR  PUT /editWithdrawal/:id
module.exports.editWithdrawal_post = async (req, res) => {
  try {
    const withdrawal = await Withdraw.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    const {
      amount,
      status,
      narration,
      walletAddress,
      cashAppTag,
      paypalEmail,
      bankName,
      accountNumber,
      country,
      swiftCode
    } = req.body;

    if (amount !== undefined) withdrawal.amount = String(amount);
    if (status !== undefined) withdrawal.status = String(status).toLowerCase();
    if (narration !== undefined) withdrawal.narration = String(narration);

    if (walletAddress !== undefined) withdrawal.walletAddress = String(walletAddress).trim();
    if (cashAppTag !== undefined) withdrawal.cashAppTag = String(cashAppTag).trim();
    if (paypalEmail !== undefined) withdrawal.paypalEmail = String(paypalEmail).trim();

    if (
      bankName !== undefined ||
      accountNumber !== undefined ||
      country !== undefined ||
      swiftCode !== undefined
    ) {
      withdrawal.bankDetails = withdrawal.bankDetails || {};
      if (bankName !== undefined) withdrawal.bankDetails.bankName = String(bankName).trim();
      if (accountNumber !== undefined) {
        withdrawal.bankDetails.accountNumber = String(accountNumber).trim();
      }
      if (country !== undefined) withdrawal.bankDetails.country = String(country).trim();
      if (swiftCode !== undefined) withdrawal.bankDetails.swiftCode = String(swiftCode).trim();
    }

    await withdrawal.save();

    return res.status(200).json({
      success: true,
      message: 'Withdrawal updated successfully',
      withdrawal: {
        _id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        type: withdrawal.type
      }
    });
  } catch (err) {
    console.error('editWithdrawal_post error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

module.exports.deleteWithdrawal = async (req, res) => {
  try {
    const w = await Withdraw.findByIdAndDelete(req.params.id);
    if (!w) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }
    return res.status(200).json({ success: true, message: 'Withdrawal deleted' });
  } catch (err) {
    console.error('deleteWithdrawal error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ********************************* ALL WALLETS *********************************

// ************************* WALLETS *************************

// GET /wallets
module.exports.allWalletPage = async (req, res) => {
  try {
    const wallets = await Wallet.find()
      .populate({
        path: 'updatedBy',
        model: 'User',
        select: 'fullname email'
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      wallets: wallets.map(w => ({
        _id: w._id,
        bank_name: w.bank_name || '',
        account_name: w.account_name || '',
        account_no: w.account_no || '',
        sortcode: w.sortcode || '',
        swift_code: w.swift_code || '',
        btc_wallet_address: w.btc_wallet_address || '',
        btc_qr_image: w.btc_qr_image || null,
        paypal_email: w.paypal_email || '',
        updatedBy: w.updatedBy
          ? {
              _id: w.updatedBy._id,
              fullname: w.updatedBy.fullname || '',
              email: w.updatedBy.email || ''
            }
          : null,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt
      })),
      admin: {
        _id: req.user._id,
        fullname: req.user.fullname || '',
        email: req.user.email || ''
      }
    });
  } catch (err) {
    console.error('allWalletPage error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load wallets'
    });
  }
};


module.exports.viewWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id)
      .populate('updatedBy', 'firstname lastname email')
      .lean();

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    return res.status(200).json({
      success: true,
      wallet,
      admin: req.user
        ? {
            _id: req.user._id,
            firstname: req.user.firstname,
            midname: req.user.midname,
            lastname: req.user.lastname,
            email: req.user.email,
            image: req.user.image
          }
        : null
    });
  } catch (error) {
    console.error('viewWallet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports.editWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id).lean();

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    return res.status(200).json({
      success: true,
      wallet,
      admin: req.user
        ? {
            _id: req.user._id,
            firstname: req.user.firstname,
            midname: req.user.midname,
            lastname: req.user.lastname,
            email: req.user.email,
            image: req.user.image
          }
        : null
    });
  } catch (error) {
    console.error('editWallet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


module.exports.editWallet_post = async (req, res) => {
  try {
    // 1. First, check if the wallet exists
    const existingWallet = await Wallet.findById(req.params.id);
    
    if (!existingWallet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Wallet not found' 
      });
    }

    // 2. Prepare the update data
    const updateData = {
      bank_name: req.body.bank_name,
      account_name: req.body.account_name,
      account_no: req.body.account_no,
      sortcode: req.body.sortcode,
      swift_code: req.body.swift_code,
      btc_wallet_address: req.body.btc_wallet_address,
      paypal_email: req.body.paypal_email,
      updatedBy: req.user._id, // assuming req.user from auth middleware
      updatedAt: Date.now()
    };

    // 3. If a new QR image was uploaded, update it
    if (req.file) {
      updateData.btc_qr_image = req.file.path; // Cloudinary URL
    }

    // 4. Perform the update and get the new document
    const updatedWallet = await Wallet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // 5. Success response
    return res.status(200).json({
      success: true,
      message: 'Wallet updated successfully',
      wallet: updatedWallet
    });

  } catch (error) {
    console.error('Edit wallet error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update wallet'
    });
  }
};

// POST /delete-wallet/:id
module.exports.deleteWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id);
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    await Wallet.deleteOne({ _id: wallet._id });

    return res.status(200).json({
      success: true,
      message: 'Wallet deleted successfully'
    });
  } catch (err) {
    console.error('deleteWallet error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete wallet' });
  }
};

// ────────────────────────────────────────────────
// NEW: Add Wallet Page & Post
// ────────────────────────────────────────────────

module.exports.addWalletPage = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      admin: req.user
        ? {
            _id: req.user._id,
            firstname: req.user.firstname,
            midname: req.user.midname,
            lastname: req.user.lastname,
            email: req.user.email,
            image: req.user.image
          }
        : null
    });
  } catch (error) {
    console.error('addWalletPage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};



module.exports.addWallet_post = async (req, res) => {
  try {
    const walletData = {
      bank_name: req.body.bank_name,
      account_name: req.body.account_name,
      account_no: req.body.account_no,
      sortcode: req.body.sortcode,
      swift_code: req.body.swift_code,
      btc_wallet_address: req.body.btc_wallet_address,
      paypal_email: req.body.paypal_email,
      updatedBy: req.user._id,
      btc_qr_image: req.file ? req.file.path : null // Cloudinary URL
    };

    const newWallet = await Wallet.create(walletData);

    return res.status(201).json({
      success: true,
      message: 'Wallet created successfully',
      wallet: newWallet
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create wallet'
    });
  }
};


// ********************************* KYC VERIFICATIONS *********************************


// GET /allVerify
module.exports.allVerification = async (req, res) => {
  try {
    const perPage = 50;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const status = (req.query.status || '').trim().toLowerCase();

    const query = {};
    if (status && status !== 'all') {
      query.status = new RegExp('^' + status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
    }

    const total = await Verification.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    const verifications = await Verification.find(query)
      .populate({
        path: 'user',
        model: 'User',
        select: 'fullname email tel country'
      })
      .populate({
        path: 'reviewedBy',
        model: 'User',
        select: 'fullname email'
      })
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .lean();

    return res.status(200).json({
      success: true,
      verifications: verifications.map(v => ({
        _id: v._id,
        document_type: v.document_type || '',
        status: v.status || 'pending',
        frontimg: v.frontimg || null,
        backimg: v.backimg || null,
        photo: v.photo || null,
        rejectionReason: v.rejectionReason || '',
        reviewedAt: v.reviewedAt || null,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        user: v.user
          ? {
              _id: v.user._id,
              fullname: v.user.fullname || '',
              email: v.user.email || '',
              tel: v.user.tel || '',
              country: v.user.country || ''
            }
          : null,
        reviewedBy: v.reviewedBy
          ? {
              _id: v.reviewedBy._id,
              fullname: v.reviewedBy.fullname || '',
              email: v.reviewedBy.email || ''
            }
          : null
      })),
      page,
      totalPages,
      perPage,
      admin: {
        _id: req.user._id,
        fullname: req.user.fullname || '',
        email: req.user.email || ''
      }
    });
  } catch (error) {
    console.error('allVerification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not load verifications',
      verifications: [],
      page: 1,
      totalPages: 1
    });
  }
};

// GET /viewVerify/:id
module.exports.viewVerify = async (req, res) => {
  try {
    const verification = await Verification.findById(req.params.id)
      .populate({
        path: 'user',
        model: 'User',
        select: 'fullname email tel country'
      })
      .populate({
        path: 'reviewedBy',
        model: 'User',
        select: 'fullname email'
      })
      .lean();

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }

    return res.status(200).json({
      success: true,
      verification: {
        _id: verification._id,
        document_type: verification.document_type || '',
        frontimg: verification.frontimg || null,
        backimg: verification.backimg || null,
        photo: verification.photo || null,
        status: verification.status || 'pending',
        rejectionReason: verification.rejectionReason || '',
        reviewedAt: verification.reviewedAt || null,
        createdAt: verification.createdAt,
        updatedAt: verification.updatedAt,
        user: verification.user
          ? {
              _id: verification.user._id,
              fullname: verification.user.fullname || '',
              email: verification.user.email || '',
              tel: verification.user.tel || '',
              country: verification.user.country || ''
            }
          : null,
        reviewedBy: verification.reviewedBy
          ? {
              _id: verification.reviewedBy._id,
              fullname: verification.reviewedBy.fullname || '',
              email: verification.reviewedBy.email || ''
            }
          : null
      },
      admin: {
        _id: req.user._id,
        fullname: req.user.fullname || '',
        email: req.user.email || ''
      }
    });
  } catch (error) {
    console.error('viewVerify error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /editVerify/:id
module.exports.editVerify = async (req, res) => {
  try {
    const verification = await Verification.findById(req.params.id)
      .populate({
        path: 'user',
        model: 'User',
        select: 'fullname email'
      })
      .lean();

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }

    return res.status(200).json({
      success: true,
      verification: {
        _id: verification._id,
        document_type: verification.document_type || '',
        status: verification.status || 'pending',
        rejectionReason: verification.rejectionReason || '',
        frontimg: verification.frontimg || null,
        backimg: verification.backimg || null,
        photo: verification.photo || null,
        user: verification.user
          ? {
              _id: verification.user._id,
              fullname: verification.user.fullname || '',
              email: verification.user.email || ''
            }
          : null
      },
      admin: {
        _id: req.user._id,
        fullname: req.user.fullname || '',
        email: req.user.email || ''
      }
    });
  } catch (error) {
    console.error('editVerify error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /editVerify/:id
module.exports.editVerify_post = async (req, res) => {
  try {
    const verification = await Verification.findById(req.params.id);
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }

    const { status, rejectionReason } = req.body;

    if (!status || !['pending', 'under review', 'approved', 'rejected', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updateData = {
      status,
      reviewedBy: req.user._id,
      reviewedAt: Date.now()
    };

    if (status === 'rejected' || status === 'declined') {
      updateData.rejectionReason = rejectionReason || '';
    } else {
      updateData.rejectionReason = undefined;
    }

    // If approving → update user KYC status
    if (status === 'approved') {
      await User.findByIdAndUpdate(verification.user, {
        kycVerified: 'approve',          // matches your schema enum
        verifiedStatus: 'Verified',
        updatedAt: Date.now()
      });
    }

    // If rejecting → optionally reset user KYC
    if (status === 'rejected' || status === 'declined') {
      await User.findByIdAndUpdate(verification.user, {
        kycVerified: 'noverify',
        verifiedStatus: 'Account not yet Verified!',
        updatedAt: Date.now()
      });
    }

    const updated = await Verification.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Verification updated successfully',
      verification: updated
    });
  } catch (error) {
    console.error('editVerify_post error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update verification'
    });
  }
};

// DELETE /deleteVerify/:id
module.exports.deleteVerify = async (req, res) => {
  try {
    const verification = await Verification.findById(req.params.id);
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }

    // Delete images from Cloudinary
    const images = [verification.frontimg, verification.backimg, verification.photo];
    for (const img of images) {
      if (img && img.includes('cloudinary')) {
        try {
          const publicId = img.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`swiftcapital/kyc/${publicId}`);
        } catch (cloudErr) {
          console.error('Cloudinary delete error:', cloudErr.message);
        }
      }
    }

    await Verification.deleteOne({ _id: req.params.id });

    return res.status(200).json({
      success: true,
      message: 'Verification record deleted successfully'
    });
  } catch (error) {
    console.error('deleteVerify error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete verification'
    });
  }
};