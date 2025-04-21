const func = require('../permissions/CommonFunc');

const ViewCustomer = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'view_customer');
    return func.sendResponse(is_assigned, res, next)
}
const CreateCustomer = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'create_customer');
    return func.sendResponse(is_assigned, res, next)
}
const UpdateCustomer = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'update_customer');
    return func.sendResponse(is_assigned, res, next)
}
const DeleteCustomer = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'delete_customer');
    return func.sendResponse(is_assigned, res, next)
}
const PrintCustomer = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'print_customer');
    return func.sendResponse(is_assigned, res, next)
}

module.exports = {
    ViewCustomer,
    CreateCustomer,
    DeleteCustomer,
    UpdateCustomer,
    PrintCustomer,
}