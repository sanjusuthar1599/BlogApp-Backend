const express = require('express');
const router = express.Router();
const { register, login, getuser, verifyEmail } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/getuser', getuser)
router.get("/verify-email", verifyEmail);

module.exports = router;
