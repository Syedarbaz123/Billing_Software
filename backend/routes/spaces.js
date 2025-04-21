const express = require('express');
const auth = require("../middleware/AuthToken.js");
const { SpaceCreateRequest } = require("../middleware/spaces/SpaceCreateRequest");
const { SpaceUpdateRequest } = require("../middleware/spaces/SpaceUpdateRequest");
const router = express.Router();
const SpaceController = require("../controllers/SpaceController");
const SpacePermissions = require("../middleware/spaces/SpacePermissions");

router.get("/all/:response_type", [auth, SpacePermissions.ViewSpace], SpaceController.spaces);
router.get("/", [auth, SpacePermissions.ViewSpace], SpaceController.spaces);
router.post("/", [SpaceCreateRequest, auth, SpacePermissions.CreateSpace], SpaceController.create);
router.delete("/:id", [auth, SpacePermissions.DeleteSpace], SpaceController.destroy);
router.get("/:id", [auth, SpacePermissions.ViewSpace], SpaceController.space);
router.put("/:id", [auth, SpaceUpdateRequest, SpacePermissions.UpdateSpace], SpaceController.update);
module.exports = router;
