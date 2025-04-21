var express = require('express');
const auth = require("../middleware/AuthToken");
var router = express.Router();
const customers = require("../controllers/CustomerController.js");
const {CustomerCreateRequest} = require("../middleware/customers/CustomerCreateRequest.js")
const {customerUpdateRequest} = require("../middleware/customers/CustomerUpdateRequest")
const CustomerPermissions = require("../middleware/customers/CustomerPermissions");

router.get('/all/:response_type', [auth, CustomerPermissions.ViewCustomer], customers.customers);
router.post("/", [CustomerCreateRequest, auth, CustomerPermissions.CreateCustomer], customers.create);
router.put('/:id', [auth, customerUpdateRequest, CustomerPermissions.UpdateCustomer], customers.update);
router.get('/:id', [auth, CustomerPermissions.ViewCustomer], customers.customer);
router.delete('/:id', [auth, CustomerPermissions.DeleteCustomer], customers.destroy);
router.post("/floor/:floor_id", [auth, CustomerPermissions.ViewCustomer], customers.floorCustomers);

module.exports = router;
