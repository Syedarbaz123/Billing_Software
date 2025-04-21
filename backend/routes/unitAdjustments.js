const express = require('express');
const auth = require("../middleware/AuthToken.js");
const {UnitAdjustmentCreateRequest} = require("../middleware/unitAdjustments/UnitAdjustmentCreateRequest.js");
const {UnitAdjustmentUpdateRequest} = require("../middleware/unitAdjustments/UnitAdjustmentUpdateRequest.js");
const router = express.Router();
const UnitAdjustmentController = require("../controllers/UnitAdjustmentController.js");
const UnitAdjustmentPermissions = require("../middleware/unitAdjustments/UnitAdjustmentPermissions.js");

router.get("/all/:response_type", [auth, UnitAdjustmentPermissions.ViewUnitAdjustment], UnitAdjustmentController.unitAdjustments);
router.get("/", [auth, UnitAdjustmentPermissions.ViewUnitAdjustment], UnitAdjustmentController.unitAdjustments);
router.post("/", [auth, UnitAdjustmentCreateRequest, UnitAdjustmentPermissions.CreateUnitAdjustment], UnitAdjustmentController.create);
router.delete("/:id", [auth, UnitAdjustmentPermissions.DeleteUnitAdjustment], UnitAdjustmentController.destroy);
router.get("/:id", [auth, UnitAdjustmentPermissions.ViewUnitAdjustment], UnitAdjustmentController.unitAdjustment);
router.put("/:id", [auth, UnitAdjustmentUpdateRequest, UnitAdjustmentPermissions.UpdateUnitAdjustment], UnitAdjustmentController.update);
module.exports = router;
