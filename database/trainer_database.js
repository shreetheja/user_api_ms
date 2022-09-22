const mysql = require('mysql2');
const DBStatusCodes = require('../error_models/databaseStatusCode');
const { DBSuccess, DBError } = require('../error_models/databaseErrors');
const log = require('../log/index');

const logger = log.getNormalLogger();
// eslint-disable-next-line no-unused-vars
class TrainerDb {
  constructor() {
    this.dbHost = process.env.MYSQL_DB_HOST;
    this.username = process.env.MYSQL_DB_USERNAME;
    this.password = process.env.MYSQL_DB_PASSWORD;
    this.dbName = process.env.MYSQL_DB_NAME;
    let out = ` host: [${this.dbHost}] username: [${this.username}] `;
    out += ` dbname: [${this.dbName}] `;
    logger.info(`Connecting to Db with: ${out}`);
    this.pool = mysql.createPool(
      {
        host: this.dbHost,
        user: this.username,
        password: this.password,
        database: this.dbName,
        max: 12,
        idleTimeoutMillis: 30000,
      },
      () => {
        logger.info('Connected to Db Succueessfully');
      },
    );
  }

  async getTrainerDetailsWithEmail(email, password = null) {
    const res = await this.getConnection();
    let conn;
    if (!res.error) {
      conn = res.rows;
      logger.debug(res);
    } else {
      const out = 'Error getting connection to get trainer user login=>';
      logger.error(`${out} ${email} error: ${res.error}}`);
      return res;
    }

    const q1 = 'select * from trainer where email=? and password = ?';
    const q2 = 'select * from trainer where email=?';
    const query = password ? q1 : q2;
    const data = password ? [email, password] : [email];
    let rows;
    try {
      [rows] = await conn.query(query, data);
      if (rows.length === 0) {
        return new DBSuccess(
          'Query Success',
          'Selection of Query Success but training user found is zero',
          conn,
          rows,
        );
      }
      return new DBSuccess(
        'Query Success',
        'Selection of Query Success and training user is found',
        conn,
        rows,
      );
    } catch (error) {
      return new DBError(
        'Select Error',
        error,
        conn,
        DBStatusCodes.SELECT_ERROR,
        `Selection training user with uid : ${email} Caused Error`,
      );
    }
  }

  async getTrainerDetails(fId, password = null) {
    const res = await this.getConnection();
    let conn;
    if (!res.error) {
      conn = res.rows;
      logger.debug(res);
    } else {
      const out = 'Error getting connection to get trainer user login=>';
      logger.error(`${out} ${fId} error: ${res.error}}`);
      return res;
    }

    const q1 = 'select * from trainer where f_id=? and password = ?';
    const q2 = 'select * from trainer where f_id=?';
    const query = password ? q1 : q2;
    const data = password ? [fId, password] : [fId];
    let rows;
    try {
      [rows] = await conn.query(query, data);
      if (rows.length === 0) {
        return new DBSuccess(
          'Query Success',
          'Selection of Query Success but training user found is zero',
          conn,
          rows,
        );
      }
      return new DBSuccess(
        'Query Success',
        'Selection of Query Success and training user is found',
        conn,
        rows,
      );
    } catch (error) {
      return new DBError(
        'Select Error',
        error,
        conn,
        DBStatusCodes.SELECT_ERROR,
        `Selection training user with uid : ${fId} Caused Error`,
      );
    }
  }

  async isTrainerMailExists(mail) {
    const res = await this.getConnection();
    let conn;
    if (!res.error) {
      conn = res.rows;
    } else {
      const out = 'Error getting connection to get mail details';
      logger.error(`${out} error: ${res.error}}`);
      return res;
    }
    const query = 'select * from trainer where email = ?';
    const data = [mail];
    let rows;
    try {
      [rows] = await conn.query(query, data);
      if (rows.length === 0) {
        return new DBSuccess(
          'Query Success',
          'Selection of Query Success but mail found is Zero',
          conn,
          rows,
        );
      }
      return new DBSuccess(
        'Query Success',
        'Selection of Query Success and mail is found',
        conn,
        rows,
      );
    } catch (error) {
      return new DBError(
        'Select Error',
        error,
        conn,
        DBStatusCodes.SELECT_ERROR,
        `Selection mail with mail: ${mail}`,
      );
    }
  }

  async isTrainerUidExists(fId) {
    const queryRes = await this.getTrainerDetails(fId);
    if (queryRes.statusCode !== DBStatusCodes.OK) {
      return queryRes;
    }
    if (queryRes.rows.length === 0) {
      return new DBSuccess(
        'Query Success',
        'Selection of Query Success but user found is zero',
        null,
        queryRes.rows,
      );
    }
    return new DBSuccess(
      'Query Success',
      'Selection of Query Success and user is found',
      null,
      queryRes.rows,
    );
  }

  async getAllCollegesForTrainer() {
    const res = await this.getConnection();
    let conn;
    if (!res.error) {
      conn = res.rows;
    } else {
      const out = 'Error getting connection to get all colleges =>';
      logger.error(`${out} error: ${res.error}}`);
      return res;
    }

    const query = 'select * from college';
    let rows;
    try {
      [rows] = await conn.query(query);
      if (rows.length === 0) {
        return new DBSuccess(
          'Query Success',
          'Selection of Query Success but college found is zero',
          conn,
          rows,
        );
      }
      return new DBSuccess(
        'Query Success',
        'Selection of Query Success and colleges are found',
        conn,
        rows,
      );
    } catch (error) {
      return new DBError(
        'Select Error',
        error,
        conn,
        DBStatusCodes.SELECT_ERROR,
        'Selection of all colleges Caused Error',
      );
    }
  }

  async getAllDeptNames(cId) {
    const resp = await this.getCollegeDetails(cId);
    if (resp.error || resp.rows.length === 0) {
      return new DBError(
        'Select Error',
        'College was not Found or something went wrong',
        null,
        DBStatusCodes.SELECT_ERROR,
        `Error or unexpected results Selection college with c_id: ${cId}`,
      );
    }

    const res = await this.getConnection();
    let conn;
    if (!res.error) {
      conn = res.rows;
    } else {
      const out = 'Error getting connection to get departments';
      logger.error(`${out} error: ${res.error}}`);
      return res;
    }

    const query = 'select d_id,d_name,c_id from department where c_id = ?';
    const data = [cId];
    let rows;
    try {
      [rows] = await conn.query(query, data);
      if (rows.length === 0) {
        return new DBSuccess(
          'Query Success',
          'Selection of Query Success but department found is zero',
          conn,
          rows,
        );
      }
      return new DBSuccess(
        'Query Success',
        'Selection of Query Success and departments are found',
        conn,
        rows,
      );
    } catch (error) {
      return new DBError(
        'Select Error',
        error,
        conn,
        DBStatusCodes.SELECT_ERROR,
        `Selection of department with c_id :${cId} Caused Error`,
      );
    }
  }

  async addNewTrainer(data) {
    const {
      name, fId, phone, email, dId, password, isEmailConfirmed, code,
    } = data;
    const res = await this.getConnection();
    let conn;
    if (!res.error) {
      conn = res.rows;
    } else {
      const out = 'Error getting connection to get adding user =>';
      logger.error(`${out} ${name} error: ${res.error}}`);
      return res;
    }
    await conn.beginTransaction();
    try {
      // eslint-disable-next-line max-len
      const userData = [
        fId,
        name,
        phone,
        email,
        dId,
        password,
        isEmailConfirmed,
        code,
      ];
      const userQuery = `insert into trainer 
      (f_id,name,phone,email,d_id,password,isEmailConfirmed,code)
      values(?,?,?,?,?,?,?,?)`;
      await conn.execute(userQuery, userData);
      await conn.commit();
      return new DBSuccess(
        'Insert Succuessful',
        `insertion user with uid : ${fId} and name : ${name} succuss`,
        conn,
        null,
      );
    } catch (error) {
      conn.rollback();
      return new DBError(
        'Insert Error rollback Succuessful',
        error,
        conn,
        DBStatusCodes.INSERT_FAILED,
        `insertion user with uid : ${fId} and name : ${name} Caused Error`,
      );
    }
  }
}
module.exports = TrainerDb;
