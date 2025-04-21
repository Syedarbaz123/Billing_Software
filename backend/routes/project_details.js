const express = require('express');
const auth = require("../middleware/AuthToken.js");
const { ProjectCreateRequest } = require("../middleware/projectDetails/projectCreateRequest.js");
const { ProjectUpdateRequest } = require("../middleware/projectDetails/projectUpdateRequest.js");
const router = express.Router();
const ProjectDetailsController = require("../controllers/ProjectController");
const ProjectPermissions = require("../middleware/projectDetails/projectPermissions.js");

router.get("/:id", [auth, ProjectPermissions.ViewProject], ProjectDetailsController.project);
router.put("/projects/:id", [auth, ProjectUpdateRequest, ProjectPermissions.UpdateProject], ProjectDetailsController.update);

module.exports = router;
