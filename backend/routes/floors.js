const express = require('express');
const auth = require("../middleware/AuthToken.js");
const {FloorCreateRequest} = require("../middleware/floors/FloorCreateRequest");
const {FloorUpdateRequest} = require("../middleware/floors/FloorUpdateRequest");
const router = express.Router();
const FloorController = require("../controllers/FloorController");
const FloorPermissions = require("../middleware/floors/FloorPermissions");

router.get("/all/:response_type", [auth, FloorPermissions.ViewFloor], FloorController.floors);
router.get("/", [auth, FloorPermissions.ViewFloor], FloorController.floors);
router.post("/", [FloorCreateRequest, auth, FloorPermissions.CreateFloor], FloorController.create);
router.delete("/:id", [auth, FloorPermissions.DeleteFloor], FloorController.destroy);
router.get("/:id", [auth, FloorPermissions.ViewFloor], FloorController.floor);
router.put("/:id", [auth, FloorUpdateRequest, FloorPermissions.UpdateFloor], FloorController.update);
module.exports = router;
  