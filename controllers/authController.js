const jsonwebtoken = require("jsonwebtoken");
const User = require("../models/User");
const sendMail = require("../utils/sendMail");


const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // "834920"
};


const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = generateOTP(); // ✅ generate 6 digit OTP (not saving to DB)
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // valid 10 mins


    const user = await User.create({ name, email, password, role , email_otp: otp, email_otp_expiry: otpExpiry});

    const token = jsonwebtoken.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    user.auth_token = token;
    await user.save();

    const userDetails = {
      user_id: user._id,
      user_name: user.name,
      user_email: user.email,
      auth_token: user.auth_token,
       email_otp: user.email_otp,
    };

    // 👇 Send email here
    const emailSent = await sendEmailForVerify(userDetails);

    if (!emailSent) {
      return res.status(500).json({ message: "Email could not be sent" });
    }

    res.status(201).json({
      userDetails,
      message: `${role} Registration successful`,
       user_id: userDetails.user_id,
    });

  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getuser = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error while fetching users:", error);
    res.status(500).json({ message: "Server error while getting users" });
  }
};       

//  * Verifies the user's email using a token.
const sendEmailForVerify = async (userDetails) => {
  try {
    const emailOptions = {
      to: userDetails.user_email,
      subject: "Your OTP for Email Verification",
      html: `
<html>
  <body style="font-family: 'Arial', sans-serif; margin: 0; padding: 1px; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 40px auto; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0;">
      <div style="background: linear-gradient(135deg, #f13a14 0%, #f8a62d 100%); padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">SKBlog</h1>
        <p style="margin: 8px 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">Email Verification</p>
      </div>
      <div style="background: #ffffff; padding: 40px 30px;">
        <h2 style="font-size: 22px; color: #333333; margin-bottom: 20px; font-weight: 600;">Hi, ${userDetails.user_name}</h2>
        <p style="font-size: 15px; color: #555555; line-height: 1.6; margin-bottom: 25px;">
          Thank you for registering with <strong style="color: #f13a14;">SKBlog</strong>! Please use the following 6-digit code to verify your email address.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #f13a14;">${userDetails.email_otp}</p>
        </div>
        <p style="font-size: 14px; color: #777777; line-height: 1.5;">
          If you did not request this, please ignore this email.
        </p>
        <p style="font-size: 13px; color: #999999; margin-top: 30px; font-style: italic;">
          Note: This OTP is valid for 10 minutes.
        </p>
      </div>
      <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
        <p style="margin: 0; font-size: 13px; color: #888888;">
          Thanks,<br>
          <strong>The SKBlog Team</strong>
        </p>
        <p style="margin: 15px 0 0; font-size: 12px; color: #aaaaaa;">
          © 2025 SKBlog. All rights reserved.
        </p>
      </div>
    </div>
  </body>
</html>
      `,
    };

    const emailSent = await sendMail(emailOptions);
    return emailSent ? true : false;
  } catch (err) {
    console.error("Error sending email:", err);
    return false;
  }
};

const verifyEmail = async (req, res) => {
const { user_id, otp } = req.body;

console.log("Verify OTP Request:", { user_id, otp });

  try {
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.is_email_verify)
      return res.status(400).json({ message: "Email already verified" });

    if (
      user.email_otp !== otp ||
      new Date(user.email_otp_expiry) < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.is_email_verify = true;
    user.email_otp = undefined;
    user.email_otp_expiry = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jsonwebtoken.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Check if email is verified
    if (!user.is_email_verify) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
      });
    }

    // Send response
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  login,
  getuser,
  verifyEmail,
};
