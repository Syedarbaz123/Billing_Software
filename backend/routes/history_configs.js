const express = require('express');
const router = express.Router();
const auth = require("../middleware/AuthToken.js");
const HistoryConfigController = require('../controllers/HistoryConfigController')

router.get("/meter/tables/:status", auth, HistoryConfigController.meterTables);
module.exports = router;
