const func = require('../permissions/CommonFunc')
const ViewBilling = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'view_billing');
    return func.sendResponse(is_assigned, res, next)
}
const CreateBilling = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'create_billing');
    return func.sendResponse(is_assigned, res, next)
}
const UpdateBilling = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'update_billing');
    return func.sendResponse(is_assigned, res, next)
}
const DeleteBilling = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'delete_billing');
    return func.sendResponse(is_assigned, res, next)
}
const PrintBilling = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'print_billing');
    return func.sendResponse(is_assigned, res, next)
}

module.exports = {
    ViewBilling,
    CreateBilling,
    DeleteBilling,
    UpdateBilling,
    PrintBilling,
}