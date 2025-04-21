const CustomerResource = require('../CustomerResource')
const ResponseType = require('../../enums/ResponseType')
const CustomerCollection = async (customers, responseType = ResponseType.FULL) => {
    let data = [];
    if (responseType === ResponseType.FULL) {
        for (const customer of customers) {
            data.push(await CustomerResource(customer))
        }
    } else if (responseType === ResponseType.COMPACT) {
        for (const customer of customers) {
            data.push({
                CId: customer.CId,
                CName: customer.CName
            })
        }
    }
    return data;
}
module.exports = CustomerCollection;