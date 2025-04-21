const MeterResource = require('../MeterResource')
const ResponseType = require('../../enums/ResponseType')
const MeterCollection = async (meters, responseType = ResponseType.FULL) => {
    let data = [];
    for (const meter of meters) {
        console.log(meter)
        if (responseType == ResponseType.FULL) {
            data.push(await MeterResource(meter))
        } else if (responseType == ResponseType.COMPACT) {
            let item = {
                id: meter.id,
                name: meter.name,
            }
            data.push(item);
        }
    }
    return data;
}
module.exports = MeterCollection;