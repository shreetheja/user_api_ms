const express = require('express');
const controller = require('../api/user_api/controller');
const { verifyUserAuthToken } = require('../utils/jwt');

const router = express.Router();

// /user/login
router.post('/login', (req, res) => controller.login(req, res));
router.get('/getAllColleges', (req, res) => controller.getAllColleges(req, res));
router.get('/getAllBatches/:cId', async (req, res) => controller.getAllBatches(req, res));
router.post('/signup', async (req, res) => controller.signup(req, res));
router.get('/isUserExists', async (req, res) => controller.isUserExists(req, res));
// eslint-disable-next-line max-len
router.get('/verifyEmail/:email/:confirmationCode', async (req, res) => controller.verifyMail(req, res));
router.get(
  '/getUserDetails',
  verifyUserAuthToken,
  async (req, res) => controller.getUserDetails(req, res),
);

module.exports = router;
