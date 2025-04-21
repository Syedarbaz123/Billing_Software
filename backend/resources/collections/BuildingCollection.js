const BuildingResource = require('../BuildingResource');

const BuildingCollection = async (buildings) => {
    let data = [];
    for (const building of buildings) {
        data.push(await BuildingResource(building));
    }
    return data;
};

module.exports = BuildingCollection;
