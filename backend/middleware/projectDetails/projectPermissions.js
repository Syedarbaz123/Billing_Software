const func = require('../permissions/CommonFunc')
const ViewFloor = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'view_floor');
    return func.sendResponse(is_assigned, res, next)
}
const CreateFloor = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'create_floor');
    return func.sendResponse(is_assigned, res, next)
}
const UpdateFloor = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'update_floor');
    return func.sendResponse(is_assigned, res, next)
}

module.exports = {
    ViewFloor,
    CreateFloor,
    UpdateFloor,
}