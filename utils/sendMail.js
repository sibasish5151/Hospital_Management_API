const nodemailer = require("nodemailer");

const sendEmail = async (email, otp) => {

const transporter = nodemailer.createTransport({
service: "gmail",
auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASS
}
});

const mailOptions = {
from: process.env.EMAIL_USER,
to: email,
subject: "Your Login OTP",
text: `Your OTP for login is: ${otp}`
};

await transporter.sendMail(mailOptions);

};

module.exports = sendEmail;