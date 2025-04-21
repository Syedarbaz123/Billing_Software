const func = require("../middleware/permissions/CommonFunc");

const unitAdjustmentResource = async (unitAdjustment) => {
    return {
        id: unitAdjustment.id,
        docDate: unitAdjustment.docDate,
        docNo: unitAdjustment.docNo,
        fromDate: unitAdjustment.fromDate,
        toDate: unitAdjustment.toDate,
        currentUnitsTonHour: unitAdjustment.currentUnitsTonHour,
        finalUnitsTonHour: unitAdjustment.finalUnitsTonHour,
        diffUnitsTonHour: unitAdjustment.diffUnitsTonHour,
        meter: await unitAdjustment.getMeter(),
        floor: unitAdjustment.MeterId == null ? null : await func.getSpaceFloor(unitAdjustment.MeterId),
        MeterId: unitAdjustment.MeterId,
        remarks: unitAdjustment.remarks,
    }
}

module.exports = unitAdjustmentResource;
