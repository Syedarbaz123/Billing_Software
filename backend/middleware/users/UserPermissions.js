const func = require('../permissions/CommonFunc')
const ViewUser = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'view_user');
    return func.sendResponse(is_assigned, res, next)
}
const CreateUser = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'create_user');
    return func.sendResponse(is_assigned, res, next)
}
const UpdateUser = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'update_user');
    return func.sendResponse(is_assigned, res, next)
}
const DeleteUser = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'delete_user');
    return func.sendResponse(is_assigned, res, next)
}
const PrintUser = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'print_user');
    return func.sendResponse(is_assigned, res, next)
}

module.exports = {
    ViewUser,
    CreateUser,
    DeleteUser,
    UpdateUser,
    PrintUser,
}