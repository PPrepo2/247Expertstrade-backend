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

router.get('/history/:id',userController.historyPage);
router.get('/trade-history/:id',userController.tradeHistoryPage);

router.post('/livetrade', upload.none(), userController.placeLiveTrade);

router.get('/personal', userController.accountSettingsPage);
router.post('/personal/:id', upload.none(), userController.updatePersonalData);

router.post(
  '/verify-account/:id',
  upload.fields([
    { name: 'frontimg', maxCount: 1 },
    { name: 'backimg', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
  ]),
  userController.verifyPage_post
);

router.get('/security', userController.editPasswordPage);
router.post('/security/:id', userController.editPassword);


// ====================== DEPOSIT FLOW ======================
router.get('/deposits', userController.depositsPage);
router.post('/deposit/:id', upload.none(), userController.deposit_post);

// THIS IS THE MISSING ROUTE ↓↓↓
router.get('/payment', userController.paymentPage);
router.get('/payment/:id', userController.paymentPage);

// Confirm proof upload
router.post('/deposit/confirm/:id', upload.single('image'), userController.depositConfirm);


router.get('/withdraw', userController.withdrawPage);
router.post('/withdraw/init/:id', userController.withdrawInit);
router.post('/withdraw/send-otp/:id', userController.withdrawSendOtp);
router.post('/withdraw/confirm/:id', userController.withdrawConfirm);

module.exports = router;

