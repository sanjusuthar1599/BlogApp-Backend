const jsonwebtoken = require("jsonwebtoken");
const User = require("../models/User");
const sendMail = require("../utils/sendMail");

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({ name, email, password, role });

    // res.status(201).json({
    //   _id: user._id,
    //   name: user.name,
    //   email: user.email,
    //   role: user.role,
    //   message: `${role} Registration successful`
    // });

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
    };

    // 👇 Send email here
    const emailSent = await sendEmailForVerify(userDetails);

    if (!emailSent) {
      return res.status(500).json({ message: "Email could not be sent" });
    }

    res.status(201).json({
      userDetails,
      message: `${role} Registration successful`,
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
     const clientUrl = process.env.APP
    const verifyUrl = `${clientUrl}/api/auth/verify-email/?token=${userDetails.auth_token}`;
    const emailOptions = {
      to: userDetails.user_email,
      subject: "Verify Your Email Address",
      text: `Hi ${userDetails.user_name}, please verify your email address by clicking the link below.`,
      html: `
<html>
  <body style="font-family: 'Arial', sans-serif; margin: 0; padding: 1px; background-color: #f5f5f5;">
    <!-- Main Container -->
    <div style="max-width: 600px; margin: 40px auto; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0;">
      
      <!-- Header with Gradient -->
      <div style="background: linear-gradient(135deg, #f13a14 0%, #f8a62d 100%); padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">SKBlog</h1>
        <p style="margin: 8px 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">Email Verification</p>
      </div>
      
      <!-- Content Card -->
      <div style="background: #ffffff; padding: 40px 30px;">
        <h2 style="font-size: 22px; color: #333333; margin-bottom: 20px; font-weight: 600;">Hi, ${userDetails.user_name}</h2>
        
        <p style="font-size: 15px; color: #555555; line-height: 1.6; margin-bottom: 25px;">
          Thank you for registering with <strong style="color: #f13a14;">SKBlog</strong>! Please click the button below to verify your email address. Once verified, you'll be able to log in and access all features.
        </p>
        
        <!-- Verify Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f13a14 0%, #f8a62d 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 3px 10px rgba(241, 58, 20, 0.2);">
            Verify Email Address
          </a>
        </div>
        
        <!-- Secondary Text -->
        <p style="font-size: 14px; color: #777777; line-height: 1.5; margin-bottom: 5px;">
          If you did not create this account, you can safely ignore this email.
        </p>
        
        <!-- Expiration Notice (optional) -->
        <p style="font-size: 13px; color: #999999; margin-top: 30px; font-style: italic;">
          Note: This verification link will expire in 24 hours.
        </p>
      </div>
      
      <!-- Footer -->
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
  try {
    const { token } = req.query;

    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    // const user = await User.findOne({ where: { id: decoded.id } });
    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid token or user not found" });

    user.is_email_verify = true;
    await user.save();

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Email verification failed" });
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
