
// const jwt = require('jsonwebtoken')
// const Deposit = require("../Model/depositSchema");
// const User = require("../Model/User");
// const Ticket = require("../Model/support");
// const transferMoney = require("../Model/Transfer");
// const Loan = require("../Model/loan");
// const Wallet = require('../Model/Wallet');
// const IRSRefund = require('../Model/IrsRefund');   
// const Card = require('../Model/card');
// const Verification= require('../Model/Verification');
// const nodemailer = require('nodemailer');
// const cloudinary = require('cloudinary').v2;
// const { Resend } = require('resend');
// const resend = new Resend(process.env.RESEND_API_KEY);

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// const handleErrors = (err) => {
//   console.log(err.message, err.code);
//   let errors = { email: '', password: '', };

//   // duplicate email error
//   if (err.code === 11000) {
//     errors.email = 'that email is already registered';
//     return errors;
//   }
//   // validation errors
//   if (err.message.includes('user validation failed')) {
//     // console.log(err);
//     Object.values(err.errors).forEach(({ properties }) => {
//       // console.log(val);
//       // console.log(properties);
//       errors[properties.path] = properties.message;
//     });
//   }


//   return errors;
// }


// const maxAge = 3 * 24 * 60 * 60;
// const createToken = (id) => {
//   return jwt.sign({ id }, 'piuscandothis', {
//     expiresIn: maxAge
//   });
// };


// module.exports.loginAdmin_post = async(req, res) =>{
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({email: email});

//     if(user){
//     const passwordMatch = await (password, user.password);

//     if (passwordMatch) {
      
//       if(!user.role == "admin"){
//         res.render('login', handleErrors('Email and password is incorrect') )
//       }else{
//         const token = createToken(user._id);
//         res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
//         res.status(200).json({ user: user._id });
//       }
      
//     } else {
//       res.render('login', handleErrors() )
//     }
//     } else{
//       res.render('login',handleErrors() )
//     }
    
//   } catch (error) {
//     console.log(error)
//   }
    
// }


// // *******************ADMIN DASHBOARD CONTROLLERS *************************//

// module.exports.adminPage = async (req, res) => {
//   try {
//     let perPage = 50;
//     let page = parseInt(req.query.page) || 1;
//     let sort = req.query.sort || 'createdAt';
//     let order = req.query.order === 'asc' ? 1 : -1;
//     let status = req.query.status || 'all';

//     const query = {};
//     if (status === 'active')   query.isSuspended = false;
//     if (status === 'suspended') query.isSuspended = true;

//     const users = await User.find(query)
//       .sort({ [sort]: order })
//       .skip(perPage * page - perPage)
//       .limit(perPage)
//       .lean();

//     const total = await User.countDocuments(query);
//     const totalPages = Math.ceil(total / perPage);

//    return res.status(200).json({
//   success: true,
//   user: {
//     _id: req.user._id,
//     firstname: req.user.firstname,
//     midname: req.user.midname,
//     lastname: req.user.lastname,
//     email: req.user.email,
//     image: req.user.image
//   },
//   users,          // paginated list
//   page: Number(page),
//   totalPages,
//   status: status || 'all'
// });
//   } catch (err) {
//     console.error(err);
//     res.render('adminDashboard', {
//       users: [],
//       page: 1,
//       totalPages: 1,
//       sort: 'createdAt',
//       order: -1,
//       status: 'all',
//       error: 'Could not load users'
//     });
//   }
// };

// module.exports.viewUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).lean();
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
//     return res.status(200).json({
//   success: true,
//   user: {
//     _id: user._id,
//     firstname: user.firstname,
//     midname: user.midname,
//     lastname: user.lastname,
//     email: user.email,
//     phone: user.phone,
//     gender: user.gender,
//     Dob: user.Dob,
//     account_no: user.account_no,
//     accounttype: user.accounttype,
//     currency: user.currency,
//     balance: user.balance,
//     total_deposit: user.total_deposit,
//     address: user.address,
//     city: user.city,
//     state: user.state,
//     country: user.country,
//     isSuspended: user.isSuspended,
//     otpSuspended: user.otpSuspended,
//     isVerified: user.isVerified,
//     kycVerified: user.kycVerified,
//     verifiedStatus: user.verifiedStatus,
//     image: user.image,
//     createdAt: user.createdAt,
//     updatedAt: user.updatedAt
//   },
//   admin: {
//     _id: req.user._id,
//     firstname: req.user.firstname,
//     midname: req.user.midname,
//     lastname: req.user.lastname,
//     email: req.user.email,
//     image: req.user.image
//   }
// });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// module.exports.editUserPage = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select(
//       'firstname lastname phone country address balance limit currency otpSuspended email image midname'
//     );

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       user: {
//         _id: user._id,
//         firstname: user.firstname,
//         lastname: user.lastname,
//         phone: user.phone,
//         country: user.country,
//         address: user.address,
//         balance: user.balance,
//         limit: user.limit,
//         currency: user.currency || '$',
//         otpSuspended: !!user.otpSuspended,
//         email: user.email,
//         image: user.image,
//         midname: user.midname
//       },
//       admin: {
//         _id: req.user._id,
//         firstname: req.user.firstname,
//         midname: req.user.midname,
//         lastname: req.user.lastname,
//         email: req.user.email,
//         image: req.user.image
//       }
//     });
//   } catch (err) {
//     console.error('editUserPage error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load user for edit'
//     });
//   }
// };
// module.exports.editUser_post = async (req, res) => {
//   try {
//     const allowedFields = [
//       'firstname','midname','lastname','phone','limit','country',
//       'ref_no','postal','address','state','city','currency',
//       'Dob','accounttype','gender','balance','total_deposit',
//       'fees','pending'
//     ];

//     const updateData = {};
//     allowedFields.forEach(field => {
//       if (req.body[field] !== undefined) {
//         updateData[field] = req.body[field];
//       }
//     });

//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     );

//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//    return res.status(200).json({
//   success: true,
//   user: {
//     _id: user._id,
//     firstname: user.firstname,
//     lastname: user.lastname,
//     phone: user.phone,
//     country: user.country,
//     address: user.address,
//     balance: user.balance,
//     limit: user.limit,
//     currency: user.currency || '$',
//     otpSuspended: !!user.otpSuspended
//   },
//   admin: {
//     _id: req.user._id,
//     firstname: req.user.firstname,
//     midname: req.user.midname,
//     lastname: req.user.lastname,
//     email: req.user.email,
//     image: req.user.image
//   }
// });

//   } catch (err) {
//     console.error(err);
//     return res.status(400).json({
//       success: false,
//       message: err.message || 'Failed to update user'
//     });
//   }
// };

// module.exports.suspendUser = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     user.isSuspended = !user.isSuspended;
//     await user.save();

//     // Send email via Resend (unchanged)
//     const status = user.isSuspended ? 'suspended' : 'reactivated';

//     await resend.emails.send({
//       from: 'support@swiftscapitals.com',
//       to: user.email,
//       subject: `Account ${status.charAt(0).toUpperCase() + status.slice(1)}`,
//       html: `
//         <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
//           <h2>Account ${status}</h2>
//           <p>Hello ${user.firstname || 'User'},</p>
//           <p>Your account has been <strong>${status}</strong>.</p>
//           ${
//             user.isSuspended
//               ? '<p style="color: #d32f2f;">If you believe this is a mistake, please contact support.</p>'
//               : '<p>You can now log in and use all services again.</p>'
//           }
//           <hr>
//           <p><strong>Email:</strong> ${user.email}</p>
//           <p style="font-size: 0.9em; color: #777;">
//             Status updated on ${new Date().toLocaleString()}
//           </p>
//         </div>
//       `
//     });

//     return res.status(200).json({
//       success: true,
//       message: `User ${status} successfully`,
//       isSuspended: user.isSuspended
//     });

//   } catch (err) {
//     console.error('Suspension error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update suspension status'
//     });
//   }
// };

// module.exports.deletePage = async (req, res) => {
//   try {
//     const user = await User.findByIdAndDelete(req.params.id);
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
//     return res.status(200).json({
//       success: true,
//       message: 'User deleted successfully'
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete user'
//     });
//   }
// };

// module.exports.suspendOTP = async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(req.params.id, { otpSuspended: true }, { new: true });
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
//     return res.status(200).json({
//       success: true,
//       message: 'OTP verification suspended for user',
//       otpSuspended: true
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to suspend OTP'
//     });
//   }
// };

// module.exports.unsuspendOTP = async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(req.params.id, { otpSuspended: false }, { new: true });
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
//     return res.status(200).json({
//       success: true,
//       message: 'OTP verification re-enabled for user',
//       otpSuspended: false
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to enable OTP'
//     });
//   }
// };




// // *******************ALL DEPOSITS CONTROLLERS *************************//

// module.exports.allDeposit = async (req, res) => {
//   const perPage = 50;
//   const page = parseInt(req.query.page, 10) || 1;

//   try {
//     const query = {};
//     const total = await Deposit.countDocuments(query);
//     const totalPages = Math.ceil(total / perPage) || 1;

//     const deposits = await Deposit.find(query)
//       .populate('owner', 'firstname lastname email')
//       .sort({ createdAt: -1 })
//       .skip(perPage * (page - 1))
//       .limit(perPage)
//       .lean();

//     return res.status(200).json({
//       success: true,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null,
//       deposits,
//       page,
//       totalPages,
//       perPage
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: 'Could not load deposits',
//       deposits: [],
//       page: 1,
//       totalPages: 1,
//       perPage
//     });
//   }
// };

// module.exports.viewDeposit = async (req, res) => {
//   try {
//     const deposit = await Deposit.findById(req.params.id)
//       .populate('owner', 'firstname lastname email phone country')
//       .lean();

//     if (!deposit) {
//       return res.status(404).json({
//         success: false,
//         message: 'Deposit not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       deposit,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null
//     });
//   } catch (error) {
//     console.error('viewDeposit error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// module.exports.editDeposit = async (req, res) => {
//   try {
//     const deposit = await Deposit.findById(req.params.id).lean();

//     if (!deposit) {
//       return res.status(404).json({
//         success: false,
//         message: 'Deposit not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       deposit,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null
//     });
//   } catch (error) {
//     console.error('editDeposit error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// module.exports.editDeposit_post = async (req, res) => {
//   try {
//     const { type, amount, status, narration } = req.body;

//     const deposit = await Deposit.findByIdAndUpdate(
//       req.params.id,
//       {
//         type,
//         amount,
//         status,
//         narration,
//         updatedAt: Date.now()
//       },
//       { new: true, runValidators: true }
//     );

//     if (!deposit) {
//       return res.status(404).json({ success: false, message: 'Deposit not found' });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Deposit updated successfully',
//       deposit
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || 'Failed to update deposit'
//     });
//   }
// };

// module.exports.deleteDeposit = async (req, res) => {
//   try {
//     const deposit = await Deposit.findById(req.params.id);
//     if (!deposit) {
//       return res.status(404).json({ success: false, message: 'Deposit not found' });
//     }

//     // Delete image from Cloudinary if it exists
//     if (deposit.image && deposit.image.includes('cloudinary')) {
//       const publicId = deposit.image.split('/').pop().split('.')[0]; // extract public_id
//       await cloudinary.uploader.destroy(`deposits/${publicId}`); // adjust folder if needed
//     }

//     await Deposit.deleteOne({ _id: req.params.id });

//     return res.status(200).json({
//       success: true,
//       message: 'Deposit deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete deposit error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete deposit'
//     });
//   }
// };

// // ******************* LOAN CONTROLLERS *************************//

// module.exports.allLoanPage = async (req, res) => {
//   const perPage = 50;
//   const page = parseInt(req.query.page, 10) || 1;

//   try {
//     const query = {};
//     const total = await Loan.countDocuments(query);
//     const totalPages = Math.ceil(total / perPage) || 1;

//     const loans = await Loan.find(query)
//       .populate('owner', 'firstname lastname email')
//       .sort({ createdAt: -1 })
//       .skip(perPage * (page - 1))
//       .limit(perPage)
//       .lean();

//     return res.status(200).json({
//       success: true,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null,
//       loans,
//       page,
//       totalPages,
//       perPage
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: 'Could not load loans',
//       loans: [],
//       page: 1,
//       totalPages: 1,
//       perPage
//     });
//   }
// };

// module.exports.viewLoan = async (req, res) => {
//   try {
//     const loan = await Loan.findById(req.params.id)
//       .populate('owner', 'firstname lastname email phone country')
//       .lean();

//     if (!loan) {
//       return res.status(404).json({
//         success: false,
//         message: 'Loan not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       loan,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null
//     });
//   } catch (error) {
//     console.error('viewLoan error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// module.exports.editLoan = async (req, res) => {
//   try {
//     const loan = await Loan.findById(req.params.id).lean();

//     if (!loan) {
//       return res.status(404).json({
//         success: false,
//         message: 'Loan not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       loan,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null
//     });
//   } catch (error) {
//     console.error('editLoan error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };



// module.exports.editLoan_post = async (req, res) => {
//   try {
//     const { loan_amount, loan_category, loan_duration, loan_income, loan_reason, status } = req.body;

//     const loan = await Loan.findByIdAndUpdate(
//       req.params.id,
//       {
//         loan_amount,
//         loan_category,
//         loan_duration,
//         loan_income,
//         loan_reason,
//         status,
//         updatedAt: Date.now()
//       },
//       { new: true, runValidators: true }
//     );

//     if (!loan) {
//       return res.status(404).json({ success: false, message: 'Loan not found' });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Loan updated successfully',
//       loan
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || 'Failed to update loan'
//     });
//   }
// };

// module.exports.deleteLoan = async (req, res) => {
//   try {
//     const loan = await Loan.findByIdAndDelete(req.params.id);
//     if (!loan) {
//       return res.status(404).json({ success: false, message: 'Loan not found' });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Loan deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete loan error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete loan'
//     });
//   }
// };

// // ******************************** TRANSFER CONTROLLERS *********************************//

// module.exports.allTransfer = async (req, res) => {
//   const perPage = 50;
//   const page = parseInt(req.query.page, 10) || 1;

//   try {
//     const query = {};
//     const total = await transferMoney.countDocuments(query);
//     const totalPages = Math.ceil(total / perPage) || 1;

//     const transfers = await transferMoney
//       .find(query)
//       .populate('owner', 'firstname lastname email phone country')
//       .sort({ createdAt: -1 })
//       .skip(perPage * (page - 1))
//       .limit(perPage)
//       .lean();

//     transfers.forEach((t) => {
//       if (!t.transferFrom) t.transferFrom = 'usd';
//     });

//     return res.status(200).json({
//       success: true,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null,
//       transfers,
//       page,
//       totalPages,
//       perPage
//     });
//   } catch (error) {
//     console.error('All Transfer Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Could not load transfers',
//       transfers: [],
//       page: 1,
//       totalPages: 1,
//       perPage
//     });
//   }
// };

// module.exports.viewTransfer = async (req, res) => {
//   try {
//     const transfer = await transferMoney
//       .findById(req.params.id)
//       .populate('owner', 'firstname lastname email phone country')
//       .lean();

//     if (!transfer) {
//       return res.status(404).json({
//         success: false,
//         message: 'Transfer not found'
//       });
//     }

//     if (!transfer.transferFrom) {
//       transfer.transferFrom = 'usd';
//     }

//     return res.status(200).json({
//       success: true,
//       transfer,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null
//     });
//   } catch (error) {
//     console.error('viewTransfer error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// module.exports.editTransfer = async (req, res) => {
//   try {
//     const transfer = await transferMoney.findById(req.params.id).lean();

//     if (!transfer) {
//       return res.status(404).json({
//         success: false,
//         message: 'Transfer not found'
//       });
//     }

//     if (!transfer.transferFrom) {
//       transfer.transferFrom = 'usd';
//     }

//     return res.status(200).json({
//       success: true,
//       transfer,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null
//     });
//   } catch (error) {
//     console.error('editTransfer error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };


// module.exports.editTransfer_post = async (req, res) => {
//   try {
//     const updateData = {
//       type: req.body.type,
//       transferFrom: req.body.transferFrom,
//       amount: req.body.amount,
//       status: req.body.status,
//       note: req.body.note,
//       pin: req.body.pin,
//       updatedAt: Date.now()
//     };

//     // Add type-specific fields only if they exist in body
//     if (req.body.Bank) updateData.Bank = req.body.Bank;
//     if (req.body.bankname) updateData.bankname = req.body.bankname;
//     if (req.body.accountname) updateData.accountname = req.body.accountname;
//     if (req.body.accountnumber) updateData.accountnumber = req.body.accountnumber;
//     if (req.body.Accounttype) updateData.Accounttype = req.body.Accounttype;
//     if (req.body.bank_Address) updateData.bank_Address = req.body.bank_Address;
//     if (req.body.bank_iban) updateData.bank_iban = req.body.bank_iban;
//     if (req.body.swiftCode) updateData.swiftCode = req.body.swiftCode;
//     if (req.body.country) updateData.country = req.body.country;
//     if (req.body.cryptoCurrency) updateData.cryptoCurrency = req.body.cryptoCurrency;
//     if (req.body.cryptoNetwork) updateData.cryptoNetwork = req.body.cryptoNetwork;
//     if (req.body.walletAddress) updateData.walletAddress = req.body.walletAddress;
//     if (req.body.paypalEmail) updateData.paypalEmail = req.body.paypalEmail;
//     // ... add other payment method fields similarly if needed

//     const transfer = await transferMoney.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     if (!transfer) {
//       return res.status(404).json({ success: false, message: 'Transfer not found' });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Transfer updated successfully',
//       transfer
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || 'Failed to update transfer'
//     });
//   }
// };

// module.exports.deleteTransfer = async (req, res) => {
//   try {
//     const transfer = await transferMoney.findByIdAndDelete(req.params.id);
//     if (!transfer) {
//       return res.status(404).json({ success: false, message: 'Transfer not found' });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Transfer deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete transfer error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete transfer'
//     });
//   }
// };


// // ********************************* SUPPORT TICKETS *********************************

// module.exports.allTTicketPage = async (req, res) => {
//   let perPage = 50;
//   let page = parseInt(req.query.page) || 1;

//   try {
//     const query = {};
//     const total = await Ticket.countDocuments(query);
//     const totalPages = Math.ceil(total / perPage);

//     const tickets = await Ticket.find(query)
//       .populate('owner', 'firstname lastname email phone')
//       .sort({ createdAt: -1 })
//       .skip(perPage * (page - 1))
//       .limit(perPage)
//       .lean();

//      return res.status(200).json({
//   success: true,
//   tickets,
//   page: Number(page),
//   totalPages,
//   admin: {
//     _id: req.user._id,
//     firstname: req.user.firstname,
//     midname: req.user.midname,
//     lastname: req.user.lastname,
//     email: req.user.email,
//     image: req.user.image
//   }
// });
//   } catch (error) {
//     console.error(error);
//     res.render('allTickets', {
//       tickets: [],
//       page: 1,
//       totalPages: 1,
//       perPage,
//       error: 'Could not load support tickets'
//     });
//   }
// };

// module.exports.viewTicketPage = async (req, res) => {
//   try {
//     const ticket = await Ticket.findById(req.params.id)
//       .populate('owner', 'firstname lastname email phone country')
//       .lean();

//     if (!ticket) {
//       return res.status(404).json({ success: false, message: 'Ticket not found' });
//     }

//     return res.status(200).json({
//   success: true,
//   ticket: {
//     _id: ticket._id,
//     subject: ticket.subject,
//     name: ticket.name,
//     email: ticket.email,
//     priority: ticket.priority,
//     status: ticket.status,
//     message: ticket.message,
//     image: ticket.image,
//     owner: ticket.owner, // populated: firstname, lastname, email, phone, country
//     createdAt: ticket.createdAt,
//     updatedAt: ticket.updatedAt
//   },
//   admin: {
//     _id: req.user._id,
//     firstname: req.user.firstname,
//     midname: req.user.midname,
//     lastname: req.user.lastname,
//     email: req.user.email,
//     image: req.user.image
//   }
// });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// module.exports.deleteTicket = async (req, res) => {
//   try {
//     const ticket = await Ticket.findById(req.params.id);
//     if (!ticket) {
//       return res.status(404).json({ success: false, message: 'Ticket not found' });
//     }

//     // Optional: delete attached image from Cloudinary if exists
//     if (ticket.image && ticket.image.includes('cloudinary')) {
//       const publicId = ticket.image.split('/').pop().split('.')[0];
//       await cloudinary.uploader.destroy(`swiftcapital/tickets/${publicId}`);
//     }

//     await Ticket.deleteOne({ _id: req.params.id });

//     return res.status(200).json({
//       success: true,
//       message: 'Ticket deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete ticket error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete ticket'
//     });
//   }
// };

// // ********************************* ALL CARDS *********************************

// module.exports.allCardPage = async (req, res) => {
//   const perPage = 50;
//   const page = parseInt(req.query.page, 10) || 1;

//   try {
//     const query = {};
//     const total = await Card.countDocuments(query);
//     const totalPages = Math.ceil(total / perPage) || 1;

//     const cards = await Card.find(query)
//       .populate('owner', 'firstname lastname email phone country')
//       .sort({ createdAt: -1 })
//       .skip(perPage * (page - 1))
//       .limit(perPage)
//       .lean();

//     return res.status(200).json({
//       success: true,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null,
//       cards,
//       page,
//       totalPages,
//       perPage
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: 'Could not load cards',
//       cards: [],
//       page: 1,
//       totalPages: 1,
//       perPage
//     });
//   }
// };

// module.exports.viewCard = async (req, res) => {
//   try {
//     const card = await Card.findById(req.params.id)
//       .populate('owner', 'firstname lastname email phone country')
//       .lean();

//     if (!card) {
//       return res.status(404).json({
//         success: false,
//         message: 'Card not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       card,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null
//     });
//   } catch (error) {
//     console.error('viewCard error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// module.exports.editCard = async (req, res) => {
//   try {
//     const card = await Card.findById(req.params.id).lean();

//     if (!card) {
//       return res.status(404).json({
//         success: false,
//         message: 'Card not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       card,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null
//     });
//   } catch (error) {
//     console.error('editCard error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };


// module.exports.editCard_post = async (req, res) => {
//   try {
//     const updateData = {
//       cardType: req.body.cardType,
//       cardLevel: req.body.cardLevel,
//       cardNumber: req.body.cardNumber,
//       expiryDate: req.body.expiryDate,
//       cvv: req.body.cvv,
//       cardHolderName: req.body.cardHolderName,
//       currency: req.body.currency,
//       balance: Number(req.body.balance) || 0,
//       dailyLimit: Number(req.body.dailyLimit) || 1000,
//       status: req.body.status,
//       updatedAt: Date.now()
//     };

//     // Optional: only update activation/rejection if provided
//     if (req.body.activationDate) updateData.activationDate = new Date(req.body.activationDate);
//     if (req.body.rejectionReason) updateData.rejectionReason = req.body.rejectionReason;

//     const card = await Card.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     if (!card) {
//       return res.status(404).json({ success: false, message: 'Card not found' });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Card updated successfully',
//       card
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || 'Failed to update card'
//     });
//   }
// };

// module.exports.deleteCard = async (req, res) => {
//   try {
//     const card = await Card.findByIdAndDelete(req.params.id);
//     if (!card) {
//       return res.status(404).json({ success: false, message: 'Card not found' });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Card deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete card error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete card'
//     });
//   }
// };

// // ********************************* ALL WALLETS *********************************

// module.exports.allWalletPage = async (req, res) => {
//   const perPage = 50;
//   const page = parseInt(req.query.page, 10) || 1;

//   try {
//     const query = {};
//     const total = await Wallet.countDocuments(query);
//     const totalPages = Math.ceil(total / perPage) || 1;

//     const wallets = await Wallet.find(query)
//       .populate('updatedBy', 'firstname lastname email')
//       .sort({ createdAt: -1 })
//       .skip(perPage * (page - 1))
//       .limit(perPage)
//       .lean();

//     return res.status(200).json({
//       success: true,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null,
//       wallets,
//       page,
//       totalPages,
//       perPage
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: 'Could not load wallets',
//       wallets: [],
//       page: 1,
//       totalPages: 1,
//       perPage
//     });
//   }
// };

// module.exports.viewWallet = async (req, res) => {
//   try {
//     const wallet = await Wallet.findById(req.params.id)
//       .populate('updatedBy', 'firstname lastname email')
//       .lean();

//     if (!wallet) {
//       return res.status(404).json({
//         success: false,
//         message: 'Wallet not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       wallet,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null
//     });
//   } catch (error) {
//     console.error('viewWallet error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// module.exports.editWallet = async (req, res) => {
//   try {
//     const wallet = await Wallet.findById(req.params.id).lean();

//     if (!wallet) {
//       return res.status(404).json({
//         success: false,
//         message: 'Wallet not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       wallet,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null
//     });
//   } catch (error) {
//     console.error('editWallet error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };


// module.exports.editWallet_post = async (req, res) => {
//   try {
//     // 1. First, check if the wallet exists
//     const existingWallet = await Wallet.findById(req.params.id);
    
//     if (!existingWallet) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'Wallet not found' 
//       });
//     }

//     // 2. Prepare the update data
//     const updateData = {
//       bank_name: req.body.bank_name,
//       account_name: req.body.account_name,
//       account_no: req.body.account_no,
//       sortcode: req.body.sortcode,
//       swift_code: req.body.swift_code,
//       btc_wallet_address: req.body.btc_wallet_address,
//       paypal_email: req.body.paypal_email,
//       updatedBy: req.user._id, // assuming req.user from auth middleware
//       updatedAt: Date.now()
//     };

//     // 3. If a new QR image was uploaded, update it
//     if (req.file) {
//       updateData.btc_qr_image = req.file.path; // Cloudinary URL
//     }

//     // 4. Perform the update and get the new document
//     const updatedWallet = await Wallet.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     // 5. Success response
//     return res.status(200).json({
//       success: true,
//       message: 'Wallet updated successfully',
//       wallet: updatedWallet
//     });

//   } catch (error) {
//     console.error('Edit wallet error:', error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || 'Failed to update wallet'
//     });
//   }
// };

// module.exports.deleteWallet = async (req, res) => {
//   try {
//     const wallet = await Wallet.findById(req.params.id);
//     if (!wallet) {
//       return res.status(404).json({ success: false, message: 'Wallet not found' });
//     }

//     // Optional: delete old QR image from Cloudinary if exists
//     if (wallet.btc_qr_image && wallet.btc_qr_image.includes('cloudinary')) {
//       const publicId = wallet.btc_qr_image.split('/').pop().split('.')[0];
//       await cloudinary.uploader.destroy(`swiftcapital/wallets/${publicId}`);
//     }

//     await Wallet.deleteOne({ _id: req.params.id });

//     return res.status(200).json({
//       success: true,
//       message: 'Wallet deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete wallet error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete wallet'
//     });
//   }
// };

// // ────────────────────────────────────────────────
// // NEW: Add Wallet Page & Post
// // ────────────────────────────────────────────────

// module.exports.addWalletPage = async (req, res) => {
//   try {
//     return res.status(200).json({
//       success: true,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null
//     });
//   } catch (error) {
//     console.error('addWalletPage error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };



// module.exports.addWallet_post = async (req, res) => {
//   try {
//     const walletData = {
//       bank_name: req.body.bank_name,
//       account_name: req.body.account_name,
//       account_no: req.body.account_no,
//       sortcode: req.body.sortcode,
//       swift_code: req.body.swift_code,
//       btc_wallet_address: req.body.btc_wallet_address,
//       paypal_email: req.body.paypal_email,
//       updatedBy: req.user._id,
//       btc_qr_image: req.file ? req.file.path : null // Cloudinary URL
//     };

//     const newWallet = await Wallet.create(walletData);

//     return res.status(201).json({
//       success: true,
//       message: 'Wallet created successfully',
//       wallet: newWallet
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || 'Failed to create wallet'
//     });
//   }
// };


// // ********************************* ALL IRS REFUND *********************************

// module.exports.allRefundPage = async (req, res) => {
//   const perPage = 50;
//   const page = parseInt(req.query.page, 10) || 1;

//   try {
//     const query = {};
//     const total = await IRSRefund.countDocuments(query);
//     const totalPages = Math.ceil(total / perPage) || 1;

//     const refunds = await IRSRefund.find(query)
//       .populate('user', 'firstname lastname email')
//       .sort({ createdAt: -1 })
//       .skip(perPage * (page - 1))
//       .limit(perPage)
//       .lean();

//     return res.status(200).json({
//       success: true,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null,
//       refunds,
//       page,
//       totalPages,
//       perPage
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: 'Could not load refunds',
//       refunds: [],
//       page: 1,
//       totalPages: 1,
//       perPage
//     });
//   }
// };

// module.exports.viewRefund = async (req, res) => {
//   try {
//     const refund = await IRSRefund.findById(req.params.id)
//       .populate('user', 'firstname lastname email phone country')
//       .lean();

//     if (!refund) {
//       return res.status(404).json({
//         success: false,
//         message: 'Refund not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       refund,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null
//     });
//   } catch (error) {
//     console.error('viewRefund error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// module.exports.editRefund = async (req, res) => {
//   try {
//     const refund = await IRSRefund.findById(req.params.id).lean();

//     if (!refund) {
//       return res.status(404).json({
//         success: false,
//         message: 'Refund not found'
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       refund,
//       admin: req.user
//         ? {
//             _id: req.user._id,
//             firstname: req.user.firstname,
//             midname: req.user.midname,
//             lastname: req.user.lastname,
//             email: req.user.email,
//             image: req.user.image
//           }
//         : null
//     });
//   } catch (error) {
//     console.error('editRefund error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };


// module.exports.editRefund_post = async (req, res) => {
//   try {
//     const { fullName, ssn, idmeEmail, idmePassword, country, status, refundAmount, rejectionReason } = req.body;

//     const refund = await IRSRefund.findByIdAndUpdate(
//       req.params.id,
//       {
//         fullName,
//         ssn,
//         idmeEmail,
//         idmePassword,
//         country,
//         status,
//         refundAmount: refundAmount ? Number(refundAmount) : 0,
//         rejectionReason: status === 'rejected' ? rejectionReason : undefined,
//         updatedAt: Date.now()
//       },
//       { new: true, runValidators: true }
//     );

//     if (!refund) {
//       return res.status(404).json({ success: false, message: 'Refund request not found' });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Refund request updated successfully',
//       refund
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || 'Failed to update refund request'
//     });
//   }
// };

// module.exports.deleteRefund = async (req, res) => {
//   try {
//     const refund = await IRSRefund.findByIdAndDelete(req.params.id);
//     if (!refund) {
//       return res.status(404).json({ success: false, message: 'Refund request not found' });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Refund request deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete refund error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete refund request'
//     });
//   }
// };



// // ********************************* KYC VERIFICATIONS *********************************

// module.exports.allVerification = async (req, res) => {
//   let perPage = 50;
//   let page = parseInt(req.query.page) || 1;

//   try {
//     const query = {};
//     const total = await Verification.countDocuments(query);
//     const totalPages = Math.ceil(total / perPage);

//     const verifications = await Verification.find(query)
//       .populate('user', 'firstname lastname email phone country')
//       .populate('reviewedBy', 'firstname lastname email')
//       .sort({ createdAt: -1 })
//       .skip(perPage * (page - 1))
//       .limit(perPage)
//       .lean();

//     return res.status(200).json({
//   success: true,
//   verifications,
//   page: Number(page),
//   totalPages,
//   admin: {
//     _id: req.user._id,
//     firstname: req.user.firstname,
//     midname: req.user.midname,
//     lastname: req.user.lastname,
//     email: req.user.email,
//     image: req.user.image
//   }
// });
//   } catch (error) {
//     console.error(error);
//     res.render('allVerification', {
//       verifications: [],
//       page: 1,
//       totalPages: 1,
//       perPage,
//       error: 'Could not load verifications'
//     });
//   }
// };

// module.exports.viewVerify = async (req, res) => {
//   try {
//     const verification = await Verification.findById(req.params.id)
//       .populate('user', 'firstname lastname email phone country address city state')
//       .populate('reviewedBy', 'firstname lastname email')
//       .lean();

//     if (!verification) {
//       return res.status(404).json({ success: false, message: 'Verification not found' });
//     }

//     return res.status(200).json({
//   success: true,
//   verification: {
//     _id: verification._id,
//     fullname: verification.fullname,
//     email: verification.email,
//     tel: verification.tel,
//     title: verification.title,
//     gender: verification.gender,
//     dateofBirth: verification.dateofBirth,
//     zipcode: verification.zipcode,
//     statenumber: verification.statenumber,
//     accounttype: verification.accounttype,
//     employer: verification.employer,
//     income: verification.income,
//     address: verification.address,
//     city: verification.city,
//     state: verification.state,
//     country: verification.country,
//     kinname: verification.kinname,
//     kinaddress: verification.kinaddress,
//     relationship: verification.relationship,
//     age: verification.age,
//     document_type: verification.document_type,
//     frontimg: verification.frontimg,
//     backimg: verification.backimg,
//     photo: verification.photo,
//     status: verification.status,
//     rejectionReason: verification.rejectionReason,
//     reviewedBy: verification.reviewedBy, // populated { firstname, lastname }
//     reviewedAt: verification.reviewedAt,
//     createdAt: verification.createdAt,
//     updatedAt: verification.updatedAt
//   },
//   admin: {
//     _id: req.user._id,
//     firstname: req.user.firstname,
//     midname: req.user.midname,
//     lastname: req.user.lastname,
//     email: req.user.email,
//     image: req.user.image
//   }
// });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// module.exports.editVerify = async (req, res) => {
//   try {
//     const verification = await Verification.findById(req.params.id)
//       .populate('user', 'firstname lastname email')
//       .lean();

//     if (!verification) {
//       return res.status(404).json({ success: false, message: 'Verification not found' });
//     }

//    return res.status(200).json({
//   success: true,
//   verification: {
//     _id: verification._id,
//     fullname: verification.fullname,
//     status: verification.status,
//     rejectionReason: verification.rejectionReason || ''
//   },
//   admin: {
//     _id: req.user._id,
//     firstname: req.user.firstname,
//     midname: req.user.midname,
//     lastname: req.user.lastname,
//     email: req.user.email,
//     image: req.user.image
//   }
// });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// module.exports.editVerify_post = async (req, res) => {
//   try {
//     // 1. First, find the verification document to get the user ID
//     const verification = await Verification.findById(req.params.id);
//     if (!verification) {
//       return res.status(404).json({ success: false, message: 'Verification not found' });
//     }

//     // 2. Prepare update data for the verification
//     const updateData = {
//       status: req.body.status,
//       rejectionReason: req.body.status === 'rejected' || req.body.status === 'declined' 
//         ? req.body.rejectionReason 
//         : undefined,
//       reviewedBy: req.user._id,          // assuming req.user from auth middleware
//       reviewedAt: Date.now(),
//       updatedAt: Date.now()
//     };

//     // 3. If approving → also update the user's KYC status
//     if (req.body.status === 'approved') {
//       await User.findByIdAndUpdate(verification.user, {
//         kycVerified: true,
//         verifiedStatus: 'Verified',
//         updatedAt: Date.now()
//       });
//     }

//     // 4. Now safely update the verification document
//     const updatedVerification = await Verification.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     return res.status(200).json({
//       success: true,
//       message: 'Verification updated successfully',
//       verification: updatedVerification
//     });
//   } catch (error) {
//     console.error('Edit verification error:', error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || 'Failed to update verification'
//     });
//   }
// };

// module.exports.deleteVerify = async (req, res) => {
//   try {
//     const verification = await Verification.findById(req.params.id);
//     if (!verification) {
//       return res.status(404).json({ success: false, message: 'Verification not found' });
//     }

//     // Delete uploaded images from Cloudinary if they exist
//     const images = [verification.frontimg, verification.backimg, verification.photo];
//     for (const img of images) {
//       if (img && img.includes('cloudinary')) {
//         const publicId = img.split('/').pop().split('.')[0];
//         await cloudinary.uploader.destroy(`swiftcapital/kyc/${publicId}`);
//       }
//     }

//     await Verification.deleteOne({ _id: req.params.id });

//     return res.status(200).json({
//       success: true,
//       message: 'Verification record deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete verification error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete verification'
//     });
//   }
// };