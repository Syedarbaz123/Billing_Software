const func = require('../permissions/CommonFunc');

const checkPermission = async function (req, res, next, validKeys) {
    let is_assigned = await func.isAssigned(req, validKeys.find(key => func.isAssigned(req, key)));
    return func.sendResponse(is_assigned, res, next);
}

const ViewMeter = async function (req, res, next) {
    return checkPermission(req, res, next, ['view_meter', 'view_meters']);
}

const CreateMeter = async function (req, res, next) {
    return checkPermission(req, res, next, ['create_meter']);
}

const UpdateMeter = async function (req, res, next) {
    return checkPermission(req, res, next, ['update_meter']);
}

const DeleteMeter = async function (req, res, next) {
    return checkPermission(req, res, next, ['delete_meter']);
}

const PrintMeter = async function (req, res, next) {
    return checkPermission(req, res, next, ['print_meter']);
}

module.exports = {
    ViewMeter,
    CreateMeter,
    DeleteMeter,
    UpdateMeter,
    PrintMeter,
}
