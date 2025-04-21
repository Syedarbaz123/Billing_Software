const BillingDetailsResource = async (BillingId, billingDetail, DocNo, RatePerTonHour) => {

    // get preview data of related customer
    //let filteredData = previewData.filter(obj => obj.CId === billingDetail.CID_web && obj.UnitsConsumedTonHour > 0);
    // let filteredData = previewData.filter(obj => obj.CId === billingDetail.CID_web);

    // //console.log("\n\n filteredData",filteredData);

    // if (filteredData.length > 0)
    //     filteredData = filteredData[0];

    //console.log("\n\n filteredData",filteredData);
    const OtherCharges = isNaN(parseFloat(billingDetail.details.OtherCharges)) ? 0 : parseFloat(billingDetail.details.OtherCharges);
    const Arrears = isNaN(parseFloat(billingDetail.details.Arrears)) ? 0 : parseFloat(billingDetail.details.Arrears);
    const ServiceCharges = isNaN(parseFloat(billingDetail.details.ServiceCharges)) ? 0 : parseFloat(billingDetail.details.ServiceCharges);
    const AdditionalCharges = isNaN(parseFloat(billingDetail.details.AdditionalCharges)) ? 0 : parseFloat(billingDetail.details.AdditionalCharges);

    const Amount = billingDetail.UnitsConsumedTonHour * RatePerTonHour;
    const TotalAmount = Amount + OtherCharges + Arrears + ServiceCharges + AdditionalCharges;


    const convertedData = {
        BillingId: BillingId,
        BillNo: 'JS-' + billingDetail.Code + '-' + DocNo, //JS-15-JUL-2022
        CID_web: BigInt(billingDetail.CId),
        FromDate: billingDetail.fromDate,
        ToDate: billingDetail.toDate,
        RatePerTonHour: BigInt(RatePerTonHour),
        PreviousReadingTonHour: billingDetail.PreviousReadingTonHour,
        CurrentReadingTonHour: billingDetail.CurrentReadingTonHour,
        UnitsConsumedTonHour: billingDetail.UnitsConsumedTonHour,
        OtherChargesText: billingDetail.details.OtherChargesText,
        OtherCharges: OtherCharges,
        ArrearsText: billingDetail.details.ArrearsText,
        Arrears: Arrears,
        ServiceChargesText: billingDetail.details.ServiceChargesText,
        ServiceCharges: ServiceCharges,
        AdditionalChargesText: billingDetail.details.AdditionalChargesText,
        AdditionalCharges: AdditionalCharges,
        Amount: Amount,
        TotalAmount: TotalAmount,
        claimedPer: 100,
        TotalPayableAmount: TotalAmount,
    }

    console.log("\n\n convertedData", convertedData);

    return convertedData;
}
module.exports = BillingDetailsResource;