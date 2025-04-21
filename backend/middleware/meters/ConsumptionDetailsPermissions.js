const func = require('../permissions/CommonFunc')
const ViewConsumptionDetails = async function (req, res, next) {
    const is_assigned = await func.isAssigned(req, 'view_consumption_details');
    return func.sendResponse(is_assigned, res, next)
}
const PrintConsumptionDetails = async function (req, res, next) {
    const is_assigned = await func.isAssigned(req, 'print_consumption_details');
    return func.sendResponse(is_assigned, res, next)
}

module.exports = {
    ViewConsumptionDetails,
    PrintConsumptionDetails
}