const express = require('express');
const auth = require("../middleware/AuthToken.js");
const { BuildingCreateRequest } = require("../middleware/Buildings/BuildingCreateRequest");
const { BuildingUpdateRequest } = require("../middleware/Buildings/BuildingUpdateRequest");
const router = express.Router();
const BuildingController = require("../controllers/BuildingController");
const BuildingPermissions = require("../middleware/Buildings/BuildingPermissions");

router.get("/all/:response_type", [auth, BuildingPermissions.ViewBuilding], BuildingController.buildings);
router.get("/", [auth, BuildingPermissions.ViewBuilding], BuildingController.buildings);
router.post("/", [BuildingCreateRequest, auth, BuildingPermissions.CreateBuilding], BuildingController.create);
router.delete("/:id", [auth, BuildingPermissions.DeleteBuilding], BuildingController.destroy);
router.get("/:id", [auth, BuildingPermissions.ViewBuilding], BuildingController.building);
router.put("/:id", [auth, BuildingUpdateRequest, BuildingPermissions.UpdateBuilding], BuildingController.update);

module.exports = router;
