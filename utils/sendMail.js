const nodemailer = require("nodemailer");

const sendMail = async (emailOptions) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"SKBlog" <${process.env.SMTP_USER}>`,
      to: emailOptions.to,
      subject: emailOptions.subject,
      text: emailOptions.text,
      html: emailOptions.html,
    });

    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
};

module.exports = sendMail;
