const express = require("express");

const router = express.Router();

const { homePage, registerPage, loginPage, register_post, login_post,  logout_get, termsPage, aboutPage,faqPage, privacyPage, contactPage , partnersPage, InvestorPage } = require("../controllers/userController");

router.get("/", homePage);
router.get("/about", aboutPage);
router.get("/investors", InvestorPage);
router.get("/partners", partnersPage);
router.get("/contact", contactPage);
router.get("/terms", termsPage);
router.get("/faq", faqPage);

router.get("/register", registerPage);
router.post('/register',register_post);


router.get("/login", loginPage);
router.post('/login',login_post)


router.get('/logout', logout_get)


module.exports = router;
