const express = require('express');
const router = express.Router();
const auth = require("../middleware/AuthToken.js");
const { MeterCreateRequest } = require("../middleware/meters/MeterCreateRequest");
const { MeterUpdateRequest } = require("../middleware/meters/MeterUpdateRequest");
const MeterController = require("../controllers/MeterController");
const MeterPermissions = require("../middleware/meters/MeterPermissions");
const BillingPermissions = require("../middleware/billings/BillingPermissions.js");
const { PrintConsumptionDetails, ViewConsumptionDetails } = require("../middleware/meters/ConsumptionDetailsPermissions");

router.get("/all/:response_type", [auth, MeterPermissions.ViewMeter], MeterController.meters);
router.get("/", [auth, MeterPermissions.ViewMeter], MeterController.meters);
router.post("/", [MeterCreateRequest, auth, MeterPermissions.CreateMeter], MeterController.create);
router.delete("/:id", [auth, MeterPermissions.DeleteMeter], MeterController.destroy);
router.get("/:id", [auth, MeterPermissions.ViewMeter], MeterController.meter);
router.put("/:id", [auth, MeterUpdateRequest, MeterPermissions.UpdateMeter], MeterController.update);

router.get('/tagging-meters/free', [auth, MeterPermissions.ViewMeter], MeterController.metersForTag);

router.get("/consumption-details", [auth, ViewConsumptionDetails], MeterController.consumptionDetails)
router.get('/consumption-details/export-excel', [auth, PrintConsumptionDetails], MeterController.exportAsExcel)
router.get('/consumption-details/export-pdf', [auth, BillingPermissions.PrintBilling], MeterController.exportAsPdf)

module.exports = router;
