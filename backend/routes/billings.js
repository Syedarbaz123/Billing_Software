const express = require('express');
const auth = require("../middleware/AuthToken.js");
const { BillingCreateRequest } = require("../middleware/billings/billingCreateRequest.js");
const { BillingUpdateRequest } = require("../middleware/billings/BillingUpdateRequest.js");
const router = express.Router();
const BillingController = require("../controllers/BillingController.js");
const BillingPermissions = require("../middleware/billings/BillingPermissions.js");

router.get("/getNewBillingMonthDetails", [auth, BillingPermissions.ViewBilling], BillingController.getNewBillingMonthDetails);
router.get("/getNewBillingDetails", [auth, BillingPermissions.ViewBilling], BillingController.getNewBillingDetails);
router.get("/previewData", [auth, BillingPermissions.ViewBilling], BillingController.getPreviewData);
router.get("/all/:response_type", [auth, BillingPermissions.ViewBilling], BillingController.billings);
router.get("/billingWithHistory/:id", [auth, BillingPermissions.ViewBilling], BillingController.billingWithHistory);
router.post("/", [BillingCreateRequest, auth, BillingPermissions.CreateBilling], BillingController.create);
router.delete("/:id", [auth, BillingPermissions.DeleteBilling], BillingController.destroy);
router.get("/:id", [auth, BillingPermissions.ViewBilling], BillingController.billing);
router.put("/:id", [auth, BillingUpdateRequest, BillingPermissions.UpdateBilling], BillingController.update);
router.get("/export/bill", [auth, BillingPermissions.PrintBilling], BillingController.generateBillPdf);


module.exports = router;
