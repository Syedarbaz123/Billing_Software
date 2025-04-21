const ActivityLogResource = require('../ActivityLogResource')

const ActivityLogCollection = async (logs) => {
    let data = [];
    for (const log of logs) {
        data.push(await ActivityLogResource(log))
    }
    return data;
}
module.exports = ActivityLogCollection;