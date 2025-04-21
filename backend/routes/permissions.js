var express = require('express');
const auth = require("../middleware/AuthToken");
var router = express.Router();
const PermissionsController = require("../controllers/PermissionController.js");
router.get('/', auth, PermissionsController.permissions);

module.exports = router;
