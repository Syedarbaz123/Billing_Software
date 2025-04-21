var express = require('express');
const auth = require("../middleware/AuthToken");
var router = express.Router();
const db = require('../models')
router.get('/counts', [auth], async (req, res) => {
    const user_count = await db.User.count() - 1;
    const meter_count = await db.Meter.count();
    const building_count = 0; //await db.Building.count();
    const site_count = 0; //await db.Site.count();
    const floor_count = await db.Floor.count();
    const customer_count = await db.Customer.count();
    return res.status(200).send({user_count, meter_count, building_count, customer_count, site_count, floor_count})
});
module.exports = router;
