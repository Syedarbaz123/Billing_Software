const ResponseType = require('../../enums/ResponseType')
const RoleCollection = async (roles, responseType = ResponseType.FULL) => {
    let data = [];
    for (const role of roles) {
        if (responseType === ResponseType.FULL) {
            data.push(role);
        } else if (responseType === ResponseType.COMPACT) {
            data.push({
                id: role.id,
                name: role.name,
                key: role.key,
                description: role.description
            })
        } else if (responseType === ResponseType.PAGINATED) {
            data.push({
                id: role.id,
                name: role.name,
                key: role.key,
                description: role.description
            })
        }
    }
    return data;
}
module.exports = RoleCollection;