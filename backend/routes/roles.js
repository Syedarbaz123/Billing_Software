var express = require('express');
const auth = require("../middleware/AuthToken");
var router = express.Router();
const roleController = require("../controllers/RoleController.js");
const {RoleCreateRequest} = require('../middleware/roles/RoleCreateRequest')
const RolePermissions = require("../middleware/roles/RolePermissions")

router.get('/getModules', [auth, RolePermissions.ViewRole], roleController.getModules);
router.post('/', [auth, RoleCreateRequest, RolePermissions.CreateRole], roleController.create);
router.put('/:id/', [auth, RolePermissions.UpdateRole], roleController.update);
router.get('/:id', [auth, RolePermissions.ViewRole], roleController.role);
router.get('/all/:response_type', [auth, RolePermissions.ViewRole], roleController.roles);
router.delete('/:id', [auth, RolePermissions.DeleteRole], roleController.destroy);

module.exports = router;
