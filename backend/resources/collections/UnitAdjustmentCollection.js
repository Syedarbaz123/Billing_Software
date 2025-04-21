const UnitAdjustmentResource = require('../UnitAdjustmentResource')
const UnitAdjustmentCollection = async (unitAdjustments) => {
    let data = [];
    for (const unitAdjustment of unitAdjustments) {
        data.push(await UnitAdjustmentResource(unitAdjustment))
    }
    return data;
}
module.exports = UnitAdjustmentCollection;