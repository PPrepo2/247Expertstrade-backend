
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

router.get('/editUser/:id',adminController.editUserPage );

router.put('/editUser/:id', adminController.editUser_post);

router.put('/suspendUser/:id', adminController.suspendUser);

router.get('/suspendOTP/:id', adminController.suspendOTP);
router.get('/unsuspendOTP/:id', adminController.unsuspendOTP);





// //************************************* */ All Deposits  routes**********************//

router.get('/allFunding',adminController.allDeposit );

router.get('/viewDeposit/:id',adminController.viewDeposit );

router.get('/editDeposit/:id',adminController.editDeposit);

router.put('/editDeposit/:id',adminController.editDeposit_post );

// //************************************* */ All Loan routes**********************//
// Loan Routes (same structure as deposits)
router.get('/allLoans', adminController.allLoanPage);
router.get('/viewLoans/:id', adminController.viewLoan);
router.get('/editLoan/:id', adminController.editLoan);
router.put('/editLoan/:id', adminController.editLoan_post);
router.delete('/deleteLoan/:id', adminController.deleteLoan);


// Transfer Routes (same structure as deposits)
router.get('/allTransfer', adminController.allTransfer);
router.get('/viewTransfer/:id', adminController.viewTransfer);
router.get('/editTransfer/:id', adminController.editTransfer);
router.put('/editTransfer/:id', adminController.editTransfer_post);
router.delete('/deleteTransfer/:id', adminController.deleteTransfer);


// //************************************* */ All Tickets**********************//
// Support Tickets Routes (same pattern as deposits, but no edit routes)
router.get("/allTickets", adminController.allTTicketPage);
router.get("/viewTickets/:id", adminController.viewTicketPage);
router.delete("/deleteTicket/:id", adminController.deleteTicket);

// **************************************ALL CARD ***************************//
// Card Routes (same structure as deposits)
router.get('/all-cards', adminController.allCardPage);
router.get('/viewCard/:id', adminController.viewCard);
router.get('/editCard/:id', adminController.editCard);
router.put('/editCard/:id', adminController.editCard_post);
router.delete('/deleteCard/:id', adminController.deleteCard);

// **************************************ALL WALLET ***************************//
// Wallet Routes (same structure as deposits + new add route)
router.get('/wallets', adminController.allWalletPage);
router.get('/viewWallet/:id', adminController.viewWallet);
router.get('/editWallet/:id', adminController.editWallet);
router.put('/editWallet/:id', upload.single('btc_qr_image'), adminController.editWallet_post);
router.delete('/deleteWallet/:id', adminController.deleteWallet);

// New: Add wallet with image upload
router.get('/addWallet', adminController.addWalletPage);
router.post('/addWallet', upload.single('btc_qr_image'), adminController.addWallet_post);

// **************************************ALL REFUND ***************************//
// IRS Refund Routes (same structure as deposits)
router.get('/allRefund', adminController.allRefundPage);
router.get('/viewRefund/:id', adminController.viewRefund);
router.get('/editRefund/:id', adminController.editRefund);
router.put('/editRefund/:id', adminController.editRefund_post);
router.delete('/deleteRefund/:id', adminController.deleteRefund);

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
