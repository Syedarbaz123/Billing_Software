const func = require('../permissions/CommonFunc')
const ViewChart = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'view_chart');
    return func.sendResponse(is_assigned, res, next)
}
const CreateChart = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'create_chart');
    return func.sendResponse(is_assigned, res, next)
}
const UpdateChart = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'update_chart');
    return func.sendResponse(is_assigned, res, next)
}
const DeleteChart = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'delete_chart');
    return func.sendResponse(is_assigned, res, next)
}
const PrintChart = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'print_chart');
    return func.sendResponse(is_assigned, res, next)
}

module.exports = {
    ViewChart,
    CreateChart,
    DeleteChart,
    UpdateChart,
    PrintChart,
}