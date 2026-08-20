
const express = require('express');

const router = express.Router();
const multer = require('multer');
const path = require('path');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'swiftcapital/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: (req, file) => `user_${req.params.id}_${Date.now()}`
  }
});

const upload = multer({ storage });

const adminController = require('../controllers/adminController');

//************************************* */  Admin Dashboard  routes**********************//

router.get('/adminiRoute',adminController.adminPage );


router.get('/viewUser/:id',adminController.viewUser );

router.get('/editUser/:id', adminController.editUserPage);
router.put('/editUser/:id', adminController.editUser_post);
router.post('/generateOtp/:id', adminController.generateOtp);

router.put('/suspendUser/:id', adminController.suspendUser);

router.get('/suspendOTP/:id', adminController.suspendOTP);
router.get('/unsuspendOTP/:id', adminController.unsuspendOTP);


// //************************************* */ All Deposits  routes**********************//

router.get('/allFunding',adminController.allDeposit );


router.get('/editDeposit/:id',adminController.editDeposit);

router.put('/editDeposit/:id',adminController.editDeposit_post );

// ***************************ALL LIVETRADES **************************

router.get('/all-livetrade', adminController.getAllTrades);
router.get('/trades-view/:id', adminController.viewTrade);
router.get('/trades-edit/:id', adminController.editTrade);
router.post('/trades-edit/:id', adminController.updateTrade);
router.post('/trades-delete/:id', adminController.deleteTrade);

// ******************************ALL WITHDRAWALS ***********************

router.get('/allWidthdrawals', adminController.allWithdrawals);
router.get('/withdrawals-edit/:id', adminController.editWithdrawalPage);
router.post('/withdrawals-edit/:id', adminController.editWithdrawal_post);
router.post('/withdrawals-delete/:id', adminController.deleteWithdrawal);

// **************************************ALL WALLET ***************************//
// Wallet Routes (same structure as deposits + new add route)
router.get('/wallets', adminController.allWalletPage);
router.get('/viewWallet/:id', adminController.viewWallet);
router.get('/editWallet/:id', adminController.editWallet);
router.post('/edit-wallet/:id', upload.fields([
  { name: 'btc_image', maxCount: 1 },
  { name: 'eth_image', maxCount: 1 },
  { name: 'usdt_image', maxCount: 1 },
  { name: 'cashapp_image', maxCount: 1 },
  { name: 'paypal_image', maxCount: 1 },
]), adminController.updateWallet);

// New: Add wallet with image upload
router.get('/addWallet', adminController.addWalletPage);
router.post('/add-wallet', upload.fields([
  { name: 'btc_image', maxCount: 1 },
  { name: 'eth_image', maxCount: 1 },
  { name: 'usdt_image', maxCount: 1 },
  { name: 'cashapp_image', maxCount: 1 },
  { name: 'paypal_image', maxCount: 1 },
]), adminController.addWallet_post);

router.delete('/deleteWallet/:id', adminController.deleteWallet);

// //************************************* */ All verify routes**********************//
// KYC Verification Routes (same structure as deposits)
router.get('/allVerify', adminController.allVerification);
router.get('/viewVerify/:id', adminController.viewVerify);
router.get('/editVerify/:id', adminController.editVerify);
router.put('/editVerify/:id', adminController.editVerify_post);
router.delete('/deleteVerify/:id', adminController.deleteVerify);

// //************************************* */ All Delete routes**********************//
router.delete('/deleteUser/:id', adminController.deletePage);
router.delete('/deleteDeposit/:id', adminController.deleteDeposit);


module.exports = router;
