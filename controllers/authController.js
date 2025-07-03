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
    const clientUrl = "https://bloga-frontend.onrender.com";
     const verifyUrl = `${clientUrl}/api/auth/verify-email/?token=${userDetails.auth_token}`;
    const emailOptions = {
      to: userDetails.user_email,
      subject: "Verify Your Email Address",
      text: `Hi ${userDetails.user_name}, please verify your email address by clicking the link below.`,
      html: `
<html>
  <body style="font-family: Arial, sans-serif; padding: 40px 20px;">
    <!-- Card -->
    <div style="max-width: 520px; margin: auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
      
      <!-- Top Header -->
     <div style="display: flex; align-items: center; justify-content: center; gap: 10px; background: linear-gradient(to bottom right, #f13a14, #f8a62d); padding: 24px 0;">
  <img src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=white" alt="logo" style="width: 40px;" />
  <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: #ffffff;">SKBlog</h1>
</div>
      <!-- Body Content -->
      <div style="padding: 30px;">
        <h2 style="font-size: 22px; color: #111111; margin-bottom: 15px;">Hi, ${userDetails.user_name}</h2>
        <p style="font-size: 15px; color: #444444; margin-bottom: 25px;">
          Thank you for registering with <strong>SKBlog</strong>! Please click the button below to verify your email address. Once verified, you’ll be able to log in and access all features.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 20px; background: linear-gradient(to bottom right, #f13a14, #f8a62d); ; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Verify Email
        </a>
        <p style="font-size: 13px; color: #777777; margin-top: 30px;">
          If you did not create this account, you can safely ignore this email.
        </p>
        <p style="margin-top: 10px; font-size: 13px; color: #777777;">
          Thanks,<br />
          The SKBlog Team
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
