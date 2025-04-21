const BillingDetailsResourceEdit = require("./BillingDetailsResourceEdit");
const moment = require('moment');

const BillingResource = async (billing) => {
    return {
        BillingId: billing.BillingId,
        DocNo: billing.DocNo,
        DocDate: moment(billing.DocDate).format('YYYY-MM-DD'),
        fromDate: moment(billing.fromDate).format('YYYY-MM-DD'),
        toDate: moment(billing.toDate).format('YYYY-MM-DD'),
        RatePerTonHour: billing.RatePerTonHour,
        BoardMsg: billing.BoardMsg,
        IssueDate: moment(billing.IssueDate).format('YYYY-MM-DD'),
        DueDate: moment(billing.DueDate).format('YYYY-MM-DD'),
        Remarks: billing.Remarks,
        headingText: billing.headingText,
        billingDetails: await BillingDetailsResourceEdit(await billing.getBillingDetails()),

    }
}
module.exports = BillingResource;