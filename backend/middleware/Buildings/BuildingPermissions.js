const func = require('../permissions/CommonFunc');

const ViewBuilding = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'view_building');
    return func.sendResponse(is_assigned, res, next);
}

const CreateBuilding = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'create_building');
    return func.sendResponse(is_assigned, res, next);
}

const UpdateBuilding = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'update_building');
    return func.sendResponse(is_assigned, res, next);
}

const DeleteBuilding = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'delete_building');
    return func.sendResponse(is_assigned, res, next);
}

const PrintBuilding = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'print_building');
    return func.sendResponse(is_assigned, res, next);
}

module.exports = {
    ViewBuilding,
    CreateBuilding,
    UpdateBuilding,
    DeleteBuilding,
    PrintBuilding,
};
