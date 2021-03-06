const nodemailer = require("nodemailer");
require("dotenv").config();
const fromMail = process.env.MAIL;
const fromPass = process.env.PASS;
const sendVerificationEmail = async ({ name, email, confirmationCode }) => {
  const transporter = await nodemailer.createTransport({
    // service: "gmail",
    service: "hotmail",
    auth: {
      user: fromMail,
      pass: fromPass,
    },
  });
  await transporter
    .sendMail({
      from: fromMail,
      to: email,
      subject: "TourBook : Please Verify your Email",
      html: `<h1>Email Confirmation</h1>
      <h2>Hello ${name}. Thanks for signing up for TourBook.</h2>
      <p>Please confirm your email by clicking on the following link</p>
      <a href=http://localhost:4000/user/validate/${confirmationCode}> Click here</a>
      </div>`,
    })
    .catch((e) => console.log(e));
};
module.exports = sendVerificationEmail;
