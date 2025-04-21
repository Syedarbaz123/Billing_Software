const db = require("../models");
const Customer = db.Customer;
const CustomerResource = require('./CustomerResource')

const BillingDetailsResourceEdit = async (billingDetails) => {

    // filter where CID_web is null
    const filteredBillingDetais = billingDetails.filter(billingDetail => billingDetail.CID_web !== null);

    const convertedBillingDetails = await filteredBillingDetais.map(async (billingDetail)=>{
        // get customer details
        const id = billingDetail.CID_web;
        const customer = await CustomerResource(await Customer.findByPk(id));

        // get meter and floor details also

        const convertedData = {
            CName: customer.CName,
            Code: customer.Code,
            CodeName: customer.Code + ' - ' + customer.CName,
            customer: customer,
            BillingId: billingDetail.BillingId,
            RowNo: billingDetail.RowNo,
            BillNo: billingDetail.BillNo,
            CID_web: billingDetail.CID_web,
            FromDate: billingDetail.FromDate,
            ToDate: billingDetail.ToDate,
            RatePerTonHour: billingDetail.RatePerTonHour,
            PreviousReadingTonHour: billingDetail.PreviousReadingTonHour,
            CurrentReadingTonHour: billingDetail.CurrentReadingTonHour,
            UnitsConsumedTonHour: billingDetail.UnitsConsumedTonHour,
            OtherChargesText: billingDetail.OtherChargesText,
            OtherCharges: billingDetail.OtherCharges,
            ArrearsText: billingDetail.ArrearsText,
            Arrears: billingDetail.Arrears,
            ServiceChargesText: billingDetail.ServiceChargesText,
            ServiceCharges: billingDetail.ServiceCharges,
            AdditionalChargesText: billingDetail.AdditionalChargesText,
            AdditionalCharges: billingDetail.AdditionalCharges,
            Amount: billingDetail.Amount,
            TotalAmount: billingDetail.TotalAmount,
            claimedPer: billingDetail.claimedPer,
            TotalPayableAmount: billingDetail.TotalPayableAmount,
        }

        return convertedData;
    })

    const resolvedBillingDetailsConverted = await Promise.all(convertedBillingDetails);

    return resolvedBillingDetailsConverted;
}
module.exports = BillingDetailsResourceEdit;