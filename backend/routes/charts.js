const express = require('express');
const auth = require("../middleware/AuthToken.js");
const router = express.Router();
const ChartController = require("../controllers/ChartController");
const ChartPermissions = require("../middleware/charts/ChartPermissions");

//router.get("/compare", [auth, ChartPermissions.ViewChart], ChartController.comparisonChartData);
router.get("/totalizer", [auth], ChartController.runTotalizer);
router.get("/compare", [auth], ChartController.comparisonChartData);
router.get("/consumptionMonths", [auth], ChartController.consumptionMonthsChartData);
router.get("/consumptionDaywise", [auth], ChartController.consumptionDaywiseChartData);
router.get("/consumptionHourwise", [auth], ChartController.consumptionHourwiseChartData);
module.exports = router;
