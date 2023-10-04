const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) CREATE A TRANSPORTER (service sending the email (not node js) like gmail)
  const transporter = nodemailer.createTransport({
    // service: 'Gmail',     if we don"t use a known service we use host and port
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },

    //activate in Gmail 'less secure app' option
  });

  // 2) DEFINE EMAIL OPTIONS
  const mailOptions = {
    from: '"Adel Bereksi" <adel@test.ex>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // 3) SENDING THE EMAIL
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
