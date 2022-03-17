const express = require('express');
const { v4: uuidv4 } = require('uuid');
const log = require('../log/index');
const UserDb = require('../database/user_database');
const {
  Api500Error, Api200Success, Api401Error, Api400Error,
} = require('../error_models/apiErrors');
const Utils = require('../utils/utils');

const router = express.Router();
const logger = log.getNormalLogger();
const db = new UserDb();
// /user/login
router.post('/login', async (req, res) => {
  const { u_id: uId, password } = req.body;
  logger.debug(`USER:${req.body.toString()} user trying to login request`);
  const dbRes = await db.getUserDetails(uId);

  if (dbRes.error) {
    const responseObj = new Api500Error(
      'Internal Server Error',
      `Database Error was Found in route /user/login: ${dbRes.error}`,
    );
    res.status(500).send(responseObj.toStringifiedJson()).end();
  } else if (dbRes.rows.length > 0) {
    const data = dbRes.rows[0];

    // is Verified
    if (data.emailStatus === 'pending') {
      const responseObj = new Api401Error(
        `USER:${uId} Login Unsuccessful please verify mail id: ${data.email} `,
        `USER:${uId} Login UnSucceussful with DB Response :${dbRes}`,
        true,
      );
      res.status(401).send(responseObj.toStringifiedJson()).end();
      return;
    }

    // eslint-disable-next-line max-len
    const isSamePassCode = await new Utils().compareHashCrypt(data.password, password);
    if (isSamePassCode) {
      const responseObj = new Api200Success(
        `USER:${uId} Login Successful `,
        `USER:${uId} Login Succeussful with DB Response :${dbRes}`,
        true,
      );
      res.status(200).send(responseObj.toStringifiedJson()).end();
    } else {
      const responseObj = new Api401Error(
        `USER:${uId} Login Unsuccessful please check credentials `,
        `USER:${uId} Login Succeussful with DB Response :${dbRes}`,
        true,
      );
      res.status(401).send(responseObj.toStringifiedJson()).end();
    }
  } else {
    const responseObj = new Api500Error(
      'Internal Server Error',
      `Database Error was Found in route /user/login: ${dbRes.error}`,
    );
    res.status(500).send(responseObj.toStringifiedJson()).end();
  }
});

router.get('/getAllColleges', async (req, res) => {
  logger.info('Getting all Colleges details ');

  const dbResp = await db.getAllCollegeNames();
  if (dbResp.error || dbResp.rows.length === 0) {
    const responseObj = new Api500Error(
      'Internal Server Error',
      `Database Error was Found in route /user/getAllColleges: ${dbResp.error}`,
    );
    res.status(500).send(responseObj.toStringifiedJson());
  } else if (dbResp) {
    const responseObj = new Api200Success(
      'get successful',
      `getColleges Succuesful with DB Response :${dbResp}`,
      dbResp.rows,
    );
    res.setTimeout(100);
    res.status(200).send(responseObj.toStringifiedJson());
  }
});

router.get('/getAllBatches/:cId', async (req, res) => {
  const { cId } = req.params;
  const dbResp = await db.getAllBatchNames(cId);
  if (dbResp.error || dbResp.rows.length === 0) {
    const responseObj = new Api500Error(
      'Internal Server Error',
      `Database Error was Found in route /user/getAllBatches: ${dbResp.error}`,
    );
    res.status(500).send(responseObj.toStringifiedJson()).end();
  } else if (dbResp) {
    const responseObj = new Api200Success(
      'get successful',
      `getAllBatches Succuesful with DB Response :${dbResp}`,
      dbResp.rows,
    );
    res.status(200).send(responseObj.toStringifiedJson()).end();
  }
});

router.post('/signup', async (req, res) => {
  const {
    name, dob, email, address, c_id: cId, b_id: bId, phone,
  } = req.body;
  const uId = req.body.u_id.toUpperCase();
  const password = await new Utils().encryptPassword(req.body.password.toString());
  const confirmationCode = uuidv4();
  const data = {
    name,
    dob,
    email,
    phone,
    uId,
    address,
    password,
    cId,
    bId,
    status: 'pending',
    confirmationCode,
  };
  const dbEmailResp = await db.isUserMailExists(email);
  const isEmailValid = await new Utils().validateMail(email);
  if (dbEmailResp.error) {
    const responseObj = new Api500Error(
      'Internal Server Error',
      `Database Error was Found in route /user/signup: ${dbEmailResp.error}`,
    );
    res.status(500).send(responseObj.toStringifiedJson()).end();
    return;
  }
  if (dbEmailResp.rows.length > 0) {
    const responseObj = new Api400Error(
      'Email Already Exists',
      `user Already Exists: ${dbEmailResp.error}`,
    );
    res.status(400).send(responseObj.toStringifiedJson()).end();
    return;
  } if (!isEmailValid) {
    const responseObj = new Api400Error(
      'Email is Invalid',
      `user email is invalid: ${isEmailValid}`,
    );
    res.status(400).send(responseObj.toStringifiedJson()).end();
    return;
  }

  const uIdDbRes = await db.isUserUidExists(uId);
  if (uIdDbRes.error) {
    const responseObj = new Api500Error(
      'Internal Server Error',
      `Database Error was Found in route /user/isUserExists: ${uIdDbRes.error}`,
    );
    res.status(500).send(responseObj.toStringifiedJson()).end();
    return;
  }
  if (uIdDbRes.rows.length > 0) {
    const responseObj = new Api400Error(
      'usn Already Exists',
      `user Already Exists: ${uIdDbRes.error}`,
    );
    res.status(400).send(responseObj.toStringifiedJson()).end();
    return;
  }

  const submitDbRes = await db.addNewUser(data);
  if (submitDbRes.error) {
    const responseObj = new Api500Error(
      'Internal Server Error',
      `Database Error was Found in route /user/isUserExists: ${uIdDbRes.error}`,
    );
    res.status(500).send(responseObj.toStringifiedJson()).end();
    return;
  }
  const responseObj = new Api200Success(
    'Success',
    `USER:${uId} Succuessfully added`,
    null,
  );
  // eslint-disable-next-line max-len
  new Utils().nodeMailCreateConfirmationMail(data.name, data.confirmationCode, data.email);
  res.status(200).send(responseObj.toStringifiedJson()).end();
});

router.get('/isUserExists', async (req, res) => {
  const { email } = req.query;
  const { u_id: uId } = req.query;
  const dbEmailResp = await db.isUserMailExists(email);
  if (dbEmailResp.error) {
    const responseObj = new Api500Error(
      'Internal Server Error',
      `Database Error was Found in route /user/isUserExists: ${dbEmailResp.error}`,
    );
    res.status(500).send(responseObj.toStringifiedJson()).end();
    return;
  }
  if (dbEmailResp.rows.length > 0) {
    const responseObj = new Api400Error(
      'Email Already Exists',
      `user Already Exists: ${dbEmailResp.error}`,
    );
    res.status(400).send(responseObj.toStringifiedJson()).end();
    return;
  }

  const uIdDbRes = await db.isUserUidExists(uId);
  if (uIdDbRes.error) {
    const responseObj = new Api500Error(
      'Internal Server Error',
      `Database Error was Found in route /user/isUserExists: ${uIdDbRes.error}`,
    );
    res.status(500).send(responseObj.toStringifiedJson()).end();
    return;
  }
  if (uIdDbRes.rows.length > 0) {
    const responseObj = new Api400Error(
      'Username Already Exists',
      `user Already Exists: ${uIdDbRes.error}`,
    );
    res.status(400).send(responseObj.toStringifiedJson()).end();
    return;
  }
  const responseObj = new Api200Success(
    'Succuess no user Exists',
    `info Succuess: ${uIdDbRes}`,
  );
  res.status(200).send(responseObj.toStringifiedJson()).end();
});

router.get('/verifyEmail/:email/:confirmationCode', async (req, res) => {
  const { email, confirmationCode } = req.params;

  // check mail exists
  const dbEmailResp = await db.isUserMailExists(email);
  if (dbEmailResp.error) {
    const responseObj = new Api500Error(
      'Internal Server Error',
      `Database Error was Found in route /user/updateMail: ${dbEmailResp.error}`,
    );
    res.status(500).send(responseObj.toStringifiedJson()).end();
    return;
  }
  if (dbEmailResp.rows.length === 0) {
    const responseObj = new Api400Error(
      `No user found with the mail ${email}`,
      'No user found with mail',
    );
    res.status(400).send(responseObj.toStringifiedJson()).end();
    return;
  }

  // update status
  const updateQuery = await db.updateMailConfirmed(confirmationCode);
  if (updateQuery.error) {
    const responseObj = new Api500Error(
      'Internal Server Error',
      `Database Error was Found in route /user/updateMail: ${dbEmailResp.error}`,
    );
    res.status(500).send(responseObj.toStringifiedJson()).end();
    return;
  }

  const responseObj = new Api200Success(
    'User is Verified 🆗 can close this tab',
    `verified user ${confirmationCode}`,
  );
  res.status(200).send(responseObj.toStringifiedJson()).end();
});

module.exports = router;
