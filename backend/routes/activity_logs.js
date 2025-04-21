const express = require('express');
const router = express.Router();
const auth = require("../middleware/AuthToken.js");
const ActivityLogController = require('../controllers/ActivityLogController.js');
const ActivityLogPermissions = require('../middleware/activityLogs/ActivityLogPermissions.js');

router.get("/all/:response_type", [auth,ActivityLogPermissions.ViewLog], ActivityLogController.logs);
router.post("/", ActivityLogController.create);

module.exports = router;
