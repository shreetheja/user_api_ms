/* eslint-disable max-classes-per-file */
const DBStatusCodes = require('./databaseStatusCode');
const log = require('../log/index');

const logger = log.getNormalLogger();
const { BaseError } = require('./baseError');

class DBError extends BaseError {
  constructor(
    name,
    error,
    conn,
    statusCode = DBStatusCodes.CONN_FAILED,
    description = 'Connection Failed.',
    rows = null,
    isCritical = false,
    query = null,
  ) {
    if (error) { logger.error(error); }
    if (isCritical) { logger.error('Critical Error the above one'); }
    // IMMEDIATE DO SOMETHING
    super(name, statusCode, true, description);
    this.error = error;
    this.rows = rows;
    this.isCritical = isCritical;
    this.query = query;
    if (conn != null) {
      conn.release();
    }
  }
}

class DBSuccess extends DBError {
  constructor(name, description, conn, rows = null) {
    super(name, null, conn, DBStatusCodes.OK, description, rows);
  }
}

module.exports = { DBError, DBSuccess };
