const CompanyResource = async (company) => {
    return {
        CoID: company.CoID,
        Name: company.Name,
        address: company.Add1,
        Contact: company.Contact,
        ContactPerson: company.ContactPerson,
        RatePerTonHour: company.RatePerTonHour,
    }
}
module.exports = CompanyResource;