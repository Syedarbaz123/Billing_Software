const func = require('../permissions/CommonFunc')
const ViewUnitAdjustment = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'view_unitadjustment');
    return func.sendResponse(is_assigned, res, next)
}
const CreateUnitAdjustment = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'create_unitadjustment');
    return func.sendResponse(is_assigned, res, next)
}
const UpdateUnitAdjustment = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'update_unitadjustment');
    return func.sendResponse(is_assigned, res, next)
}
const DeleteUnitAdjustment = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'delete_unitadjustment');
    return func.sendResponse(is_assigned, res, next)
}
const PrintUnitAdjustment = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'print_unitadjustment');
    return func.sendResponse(is_assigned, res, next)
}

module.exports = {
    ViewUnitAdjustment,
    CreateUnitAdjustment,
    DeleteUnitAdjustment,
    UpdateUnitAdjustment,
    PrintUnitAdjustment,
}