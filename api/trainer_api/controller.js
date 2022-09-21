const { v4: uuidv4 } = require('uuid');
const log = require('../../log/index');
const UtilModule = require('../../utils/utils');
const {
  Api500Error,
  Api200Success,
  Api401Error,
  Api400Error,
} = require('../../error_models/apiErrors');
const UserDb = require('../../database/user_database');
const { signTrainerToken } = require('../../utils/jwt');

const db = new UserDb();
const utils = new UtilModule();
const logger = log.getNormalLogger();
class TrainerController {
  static async login(req, res) {
    try {
      const { f_id: fId, password } = req.body;
      logger.debug(`FID : ${fId} PASSWORD: ${password}`);
      if (TrainerController.isEmptyOrUndefined([fId, password])) {
        const responseObj = new Api400Error(
          'TRAINER: bad request missing params ',
          'TRAINER: bad request missing params ',
        );
        res.status(400).send(responseObj.toStringifiedJson());
        return;
      }
      logger.debug('TRAINER: user tying to login request');
      const dbRes = await db.getTrainerDetails(fId.toUpperCase());
      if (dbRes.error) {
        TrainerController.send500Api(res, `Db error found : ${dbRes.error}`);
        return;
      }
      if (dbRes.rows <= 0) {
        const responseObj = new Api400Error(
          'TRAINER: User not found',
          `TRAINER: User with ${fId} not found `,
        );
        res.status(400).send(responseObj.toStringifiedJson());
        return;
      }
      const data = dbRes.rows[0];
      // is verified
      if (!data.isEmailConfirmed) {
        const responseObj = new Api401Error(
          `TRAINER:Login Unsuccessful please verify mail id: ${data.email} `,
          `TRAINER:${fId} Login UnSucceussful with DB Response :${dbRes}`,
        );
        res.status(400).send(responseObj.toStringifiedJson());
        return;
      }

      // is same passcode
      const isSamePassCode = await utils.compareHashCrypt(
        data.password,
        password,
      );
      if (!isSamePassCode) {
        const responseObj = new Api401Error(
          'Either User name or password is not right !',
          'User name not present',
        );
        res.status(401).send(responseObj.toStringifiedJson());
        return;
      }
      // JWT
      const code = signTrainerToken({ fId });
      const responseObj = new Api200Success(
        'USER: Login Successful ',
        `USER:${fId} Login Succeussful with DB Response :${dbRes}`,
        { access_code: code },
      );
      res.status(200).send(responseObj.toStringifiedJson());
    } catch (error) {
      const responseObj = new Api500Error(
        'Internal Server Error',
        `Error was Found in route /trainer/login: ${error}`,
      );
      res.status(500).send(responseObj.toStringifiedJson()).end();
    }
  }

  static async signUp(req, res) {
    try {
      const {
        name, phone, email, d_id: dId, password, f_id: fId,
      } = req.body;
      if (TrainerController.isEmptyOrUndefined([
        name, phone, email, dId, password, fId])) {
        const responseObj = new Api400Error(
          'TRAINER: bad request missing params ',
          'TRAINER: bad request missing params ',
        );
        res.status(400).send(responseObj.toStringifiedJson());
        return;
      }
      const dbEmailResp = await db.isUserMailExists(email);
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
      }
      const fIdDbRes = await db.isTrainerUidExists(fId);
      if (fIdDbRes.error) {
        const responseObj = new Api500Error(
          'Internal Server Error',
          `Database Error was Found in route /user/isUserExists: ${fIdDbRes.error}`,
        );
        res.status(500).send(responseObj.toStringifiedJson()).end();
        return;
      }
      if (fIdDbRes.rows.length > 0) {
        const responseObj = new Api400Error(
          'Faculty id Already Exists',
          `user Already Exists: ${fIdDbRes.error}`,
        );
        res.status(400).send(responseObj.toStringifiedJson()).end();
        return;
      }
      const newFId = fId.toUpperCase();
      const enPassword = await utils.encryptPassword(password);
      const confirmationCode = uuidv4();
      const data = {
        name,
        fId: newFId,
        phone,
        email,
        dId,
        password: enPassword,
        isEmailConfirmed: false,
        code: confirmationCode,
      };
      const submitDbRes = await db.addNewTrainer(data);
      if (submitDbRes.error) {
        TrainerController.send500Api(
          res,
          `Database Error was Found in route /trainer/signup: ${submitDbRes.error}`,
        );
        return;
      }
      const responseObj = new Api200Success(
        'Success',
        `USER:${fId} Succuessfully added`,
        null,
      );
      utils.nodeMailCreateConfirmationMail(name, confirmationCode, email);
      res.status(200).send(responseObj.toStringifiedJson()).end();
    } catch (error) {
      TrainerController.send500Api(
        res,
        `Database Error was Found in route /trainer/signup: ${error}`,
      );
    }
  }

  static async getAllCollegesForTrainer(req, res) {
    try {
      logger.info('Getting all Colleges details ');

      const dbResp = await db.getAllCollegeNames();
      if (dbResp.error || dbResp.rows.length === 0) {
        TrainerController.send500Api(
          res,
          `Database Error was Found in route /user/getAllColleges: ${dbResp.error}`,
        );
        return;
      } if (dbResp) {
        const responseObj = new Api200Success(
          'get successful',
          `getColleges Succuesful with DB Response :${dbResp}`,
          dbResp.rows,
        );
        res.status(200).send(responseObj.toStringifiedJson());
      }
    } catch (error) {
      TrainerController.send500Api(
        res,
        `Database Error was Found in route /trainer/signup: ${error}`,
      );
    }
  }

  static async getAllDeptNames(req, res) {
    const { c_id: cId } = req.query;
    const dbResp = await db.getAllDeptNames(cId);
    if (dbResp.error || dbResp.rows.length === 0) {
      const responseObj = new Api500Error(
        'Internal Server Error',
        `Database Error was Found in route /user/getAllDeptNames: ${dbResp.error}`,
      );
      res.status(500).send(responseObj.toStringifiedJson()).end();
    } else if (dbResp) {
      const responseObj = new Api200Success(
        'get successful',
        `getAllDeptNames Succuesful with DB Response :${dbResp}`,
        dbResp.rows,
      );
      res.status(200).send(responseObj.toStringifiedJson()).end();
    }
  }

  static isEmptyOrUndefined(params) {
    console.log(params);
    let returnType = false;
    params.forEach((ele) => {
      if (!ele || ele === '') {
        returnType = true;
      }
    });
    return returnType;
  }

  static async send500Api(res, logMessage) {
    const responseObj = new Api500Error('Internal Server Error', logMessage);
    res.status(500).send(responseObj.toStringifiedJson());
  }
}
module.exports = TrainerController;
