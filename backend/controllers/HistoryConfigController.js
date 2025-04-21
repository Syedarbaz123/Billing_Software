const db = require("../models");
const HistoryConfig = db.HistoryConfig;
const Meter = db.Meter;
const {Op} = require('sequelize')
module.exports = {
    async meterTables(req, res) {
        let status = req.params.status;
        let historyConfig = [];
        if (status === 'enabled') {
            let enabled_meter_ids = await Meter.findAll({
                where: {
                    status: true
                },
                attributes: ['history_config_id'],
                raw: true
            }).then(meters => meters.map(meter => meter.history_config_id));
            
            historyConfig = await HistoryConfig.findAll(
                {
                    where: {
                        id: {[Op.notIn]: enabled_meter_ids}
                    }
                }
            );
        } else if (status == 'all') {
            historyConfig = await HistoryConfig.findAll();
        }
        historyConfig = historyConfig.map(item => {
            return {
                id: item.ID,
                table: item.TABLE_NAME.toLowerCase()
            }
        })
        console.log("all free meters", historyConfig)
        return res.status(200).json({'meter_tables': historyConfig})
    }
}

