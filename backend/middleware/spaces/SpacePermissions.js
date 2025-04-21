const func = require('../permissions/CommonFunc')

const ViewSpace = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'view_space');
    return func.sendResponse(is_assigned, res, next)
}
const CreateSpace = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'create_space');
    return func.sendResponse(is_assigned, res, next)
}
const UpdateSpace = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'update_space');
    return func.sendResponse(is_assigned, res, next)
}
const DeleteSpace = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'delete_space');
    return func.sendResponse(is_assigned, res, next)
}
const PrintSpace = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'print_space');
    return func.sendResponse(is_assigned, res, next)
}

module.exports = {
    ViewSpace,
    CreateSpace,
    DeleteSpace,
    UpdateSpace,
    PrintSpace,
}