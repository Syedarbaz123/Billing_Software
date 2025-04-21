
const SpaceResource = require("./SpaceResource");

const CustomerResource = async (customer) => {

    return {
        CId: customer.CId,
        CName: customer.CName,
        Code: customer.Code,
        Email: customer.Email,
        MobNo: customer.MobNo,
        TelNo: customer.TelNo,
        ContactPerson: customer.ContactPerson,
        address: customer.Address,
        enable_date: customer.enable_date,
        disable_date: customer.disable_date,
        status: customer.status,
        space: await SpaceResource(await customer.getSpace()),
    };

};

module.exports = CustomerResource;