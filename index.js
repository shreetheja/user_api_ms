const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const express = require('express');
const moment = require('moment');
const cors = require('cors');
const log = require('./log/index');
const adminRoute = require('./routes/admin');
const userRoute = require('./routes/user');
const { Api500Error } = require('./error_models/apiErrors');
const trainerRoute = require('./routes/trainer');

const logger = log.getNormalLogger();
const app = express();
app.use(express.json());
app.use(cors());
logger.info(`_________________Restarted at: ${moment.utc()}_______________________`);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', adminRoute);
app.use('/user', userRoute);
app.use('/trainer', trainerRoute);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(`error => ${err}`);
  const out = `Error Occured For => ${err.toString()}`;
  const resObj = new Api500Error('Internal Error', out);
  res.status(500).send(resObj.toStringifiedJson());
});
const server = app.listen(
  process.env.PORT,
  () => {
    logger.info(`UserMS Server is Up and Listening at ${process.env.PORT}👂🏻`);
  },
);

server.keepAliveTimeout = 30;
