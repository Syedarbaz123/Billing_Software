const db = require("../models");
const ActivityLogCollection = require("../resources/collections/ActivityLogCollection");
const ActivityLog = db.ActivityLog;
const ResponseType = require('../enums/ResponseType')
const Paging = require('../helpers/Paging')
const { Op } = require('sequelize')

 
module.exports = {

    async create(type, desc, user_id) {
        console.log(type, desc, user_id)
        const log = await ActivityLog.create({
            OperationType: type,
            Description: desc,
            UserID: user_id
        });
    },


    async logs(req, res) {
        let responseType = req.params.response_type;
        if (!responseType) {
            responseType = ResponseType.FULL;
        }
        
        if (responseType == ResponseType.PAGINATED) {
            const { size, currentPage, search, sortBy, orderBy } = req.query;
            const { limit, offset } = Paging.getPagination(currentPage, size);
            const condition = {
                [Op.or]: [
                    {
                        OperationType: {
                            [Op.like]: `%${search}%`
                        }
                    },
                    {
                        UserID: {
                            [Op.like]: `%${search}%`
                        }
                    },
                    {
                        createdAt: {
                            [Op.like]: `%${search}%`
                        }
                    },
                ]
            }
            let order = [
                ['id', 'DESC']
            ];
            if (sortBy) {
                order = [[sortBy, orderBy]]
            }
            await ActivityLog.findAndCountAll({
                where: condition,
                order: order,
                limit,
                offset
            })
                .then(async data => {
                    const logs = await ActivityLogCollection(data.rows);
                    const pagination = await Paging.getPagingData(data, currentPage, limit, search);
                    res.status(200).json({ logs, pagination });
                });
        } else if (responseType === ResponseType.FULL) {

            let logs = await ActivityLog.findAll();
            // get compact results for combo
            logs = await AcitivityLogCollection(logs, ResponseType.COMPACT);
            return res.status(200).json({ logs: logs })
        }
    }
}