const express = require('express');
const TrainerController = require('../api/trainer_api/controller');
const { verifyTrainerAuthToken } = require('../utils/jwt');

const router = express.Router();

router.post('/login', TrainerController.login);
router.post('/signup', TrainerController.signUp);
router.get('/getAllColleges', TrainerController.getAllCollegesForTrainer);
router.get('/getAllDeptNames', TrainerController.getAllDeptNames);
router.get(
  '/getTrainerDetails',
  verifyTrainerAuthToken,
  async (req, res) => TrainerController.getTrainerDetails(req, res),
);

module.exports = router;
