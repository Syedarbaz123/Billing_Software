var express = require('express');
const auth = require("../middleware/AuthToken");
var router = express.Router();
const users = require("../controllers/UserController.js");
const { loginRequest } = require("../middleware/users/LoginRequest.js")
const { userCreateRequest } = require("../middleware/users/UserCreateRequest.js")
const { userUpdateRequest } = require("../middleware/users/UserUpdateRequest")
const { ProfileUpdateRequest } = require("../middleware/users/ProfileUpdateRequest")
const { changePassword } = require("../middleware/users/ChangePasswordRequest.js")
const UserPermissions = require("../middleware/users/UserPermissions");



// router.post("/create",  users.create );
router.post("/", [userCreateRequest, auth, UserPermissions.CreateUser], users.create);
router.post("/login", loginRequest, users.login);
router.post("/user/change-password", [auth, changePassword], users.changePassword);
router.get('/user', auth, users.profile);
router.put('/:id', [auth, userUpdateRequest, UserPermissions.UpdateUser], users.update);
router.put('/user/profile', [auth, ProfileUpdateRequest], users.profileUpdate);
router.get('/user/:id', [auth, UserPermissions.ViewUser], users.user);
router.delete('/:id', [auth, UserPermissions.DeleteUser], users.destroy);
router.get('/', [auth, UserPermissions.ViewUser], users.users);



module.exports = router;
