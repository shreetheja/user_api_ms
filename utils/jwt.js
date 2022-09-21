const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const secret = process.env.JWT_SECRET;

function signWebToken(payload) {
  return jwt.sign(payload, secret);
}

module.exports = { signWebToken };
