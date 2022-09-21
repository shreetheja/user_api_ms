const express = require('express');
const TrainerController = require('../api/trainer_api/controller');

const router = express.Router();

router.post('/login', TrainerController.login);

module.exports = router;
