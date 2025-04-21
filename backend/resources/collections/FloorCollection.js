const FloorResource = require('../FloorResource')
const FloorCollection = async (floors) => {
    let data = [];
    for (const floor of floors) {
        data.push(await FloorResource(floor))
    }
    return data;
}
module.exports = FloorCollection;