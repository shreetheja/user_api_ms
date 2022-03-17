/* eslint-disable max-len */
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const emailValidator = require('deep-email-validator');
const log = require('../log/index');

const logger = log.getNormalLogger();

const saltRounds = parseInt(process.env.SALT_ROUND, 10);
const workerMail = process.env.WORKER_MAIL;
const workerPassword = process.env.WORKER_PASSWORD;
const transport = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: workerMail,
    pass: workerPassword,
  },
  secure: true,
});
function Utils() {
  this.encryptPassword = async (password) => {
    try {
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      logger.error(error);
      return null;
    }
  };
  this.compareHashCrypt = async (hash, sentPassword) => {
    try {
      const isMatch = await bcrypt.compare(sentPassword, hash);
      return isMatch;
    } catch (error) {
      logger.error(error);
      return null;
    }
  };
  this.nodeMailCreateConfirmationMail = async (name, confirmationCode, to) => {
    transport.sendMail({
      from: workerMail,
      to,
      subject: 'Please confirm your account',
      html: `<h1>Email Confirmation</h1>
          <h2>Hello ${name}</h2>
          <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
          <a href=https://api.examvedha.com/user/verifyEmail/${to}/${confirmationCode}> Click here</a>
          </div>`,
    }).catch((err) => logger.error(err));
  };
  // eslint-disable-next-line no-return-await
  this.validateMail = async (email) => {
    const validation = await emailValidator.validate(email);
    return validation.valid;
  };
}

module.exports = Utils;
