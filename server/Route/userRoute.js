const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
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

router.get('/dashboard',userController.dashboardPage);

router.get('/accounthistory/:id',userController.historyPage);
router.get('/trade-history/:id',userController.tradeHistoryPage);

router.post('/livetrade', upload.none(), userController.placeLiveTrade);

router.get('/account-settings',userController.accountSettingsPage);
router.post('/account-settings/:id', upload.single('image'), userController.updateProfilePicture);
router.get('/editpass/:id',userController.editPasswordPage);
router.post('/editpass/:id',userController.editPassword);
router.post('/changepin/:id', userController.changePin);

// kyc route
router.get('/kyc-form',userController.kycPage);
router.get('/verify-account',userController.verifyPage);
router.post(
  '/verify-account/:id',
  upload.fields([
    { name: 'frontimg', maxCount: 1 },
    { name: 'backimg',  maxCount: 1 },
    { name: 'photo',    maxCount: 1 }
  ]),
  userController.verifyPage_post
);


// ====================== DEPOSIT FLOW ======================
router.get('/deposits', userController.depositsPage);
router.post('/deposit/:id', upload.none(), userController.deposit_post);

// THIS IS THE MISSING ROUTE ↓↓↓
router.get('/payment', userController.paymentPage);
router.get('/payment/:id', userController.paymentPage);

// Confirm proof upload
router.post('/deposit/confirm/:id', upload.single('image'), userController.depositConfirm);





module.exports = router;

