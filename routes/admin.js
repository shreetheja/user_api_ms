const express = require('express');
const log = require('../log/index');

const router = express.Router();
const logger = log.getNormalLogger();

// /admin/getInfo?uid=4SF18CS144
router.post('/login', async (req, res) => {
  logger.http(`user trying to login request :${req.body.u_id}`);
  logger.debug(`user trying to login request :${req.body.toString()}`);

  res.status(200).send();
});
module.exports = router;
