const func = require('../permissions/CommonFunc')

const ViewLog = async function (req, res, next) {
    let is_assigned = await func.isAssigned(req, 'view_activitylog');
    return func.sendResponse(is_assigned, res, next)
}

module.exports = {
    ViewLog,
}