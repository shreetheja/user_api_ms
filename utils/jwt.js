const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const log = require('../log/index');

const logger = log.getNormalLogger();
dotenv.config();
const secret = process.env.JWT_SECRET;
const {
  Api401Error,
} = require('../error_models/apiErrors');

function signTrainerToken(payload) {
  if (!payload.identity) {
    logger.error(`The Required Payload not Found : values passed
    identity: ${payload.identity}`);
    return null;
  }
  return jwt.sign(payload, secret);
}

function signUserToken(payload) {
  if (!payload.uId) {
    logger.error(`The Required Payload not Found : values passed
    u_id: ${payload.uId}`);
    return null;
  }
  return jwt.sign(payload, secret);
}

function verifyWebToken(token) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    logger.info(`The Payload was Modified payload: ${error}`);
    return error;
  }
}

function verifyUserAuthToken(req, res, next) {
  console.log(req);
  const authHeader = req.headers.authorization;
  logger.debug(`Auth Header : ${authHeader}`);
  const token = authHeader && authHeader.split(' ')[1];
  logger.debug(token);
  if (token == null) return res.sendStatus(401);
  const requestedForUid = req.query.u_id || req.body.u_id;
  logger.debug(`Requestd For UID: ${requestedForUid}`);
  const decodedToken = verifyWebToken(token);
  logger.debug(`Decode Token : ${decodedToken}`);
  if (!decodedToken || decodedToken.uId !== requestedForUid) {
    const responseObj = new Api401Error(
      'Login Unsuccessful ',
      'Login Unsucceussful',
    );
    res.status(401).send(responseObj.toStringifiedJson());
    return null;
  }
  req.payload = next();
  return null;
}

function verifyTrainerAuthToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split('')[1];
  if (token == null) return res.sendStatus(401);
  const decodedToken = verifyWebToken(token);
  const requestedForFid = req.query.identity || req.body.identity;
  if (!decodedToken || decodedToken.fId !== requestedForFid) {
    const responseObj = new Api401Error(
      'Login Unsuccessful ',
      'Login Unsucceussful',
    );
    res.status(401).send(responseObj.toStringifiedJson());
    return null;
  }
  req.payload = next();
  return null;
}
module.exports = {
  signTrainerToken,
  verifyWebToken,
  signUserToken,
  verifyUserAuthToken,
  verifyTrainerAuthToken,
};
