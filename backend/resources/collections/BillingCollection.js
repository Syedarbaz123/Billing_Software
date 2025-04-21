const BillingResource = require('../BillingResource')
const BillingCollection = async (billings) => {
    let data = [];
    for (const billing of billings) {
        data.push(await BillingResource(billing))
    }
    return data;
}
module.exports = BillingCollection;