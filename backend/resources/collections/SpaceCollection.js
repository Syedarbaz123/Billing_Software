const SpaceResource = require('../SpaceResource')

const SpaceCollection = async (spaces) => {
    let data = [];
    for (const space of spaces) {
        data.push(await SpaceResource(space))
    }
    return data;
}
module.exports = SpaceCollection;