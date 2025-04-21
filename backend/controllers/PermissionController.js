const { Op } = require("sequelize");
const db = require("../models");
const Permission = db.Permission;

module.exports = {
    async permissions(req, res) {
        let response = null;
        let condition ={};
        condition = {
            group_name: {
                [Op.notLike]: 'Graphs',
            }
        }
      
        const permissions = await Permission.findAll({
            where: condition,
        });
        response = res.status(200).json({permissions: permissions});
        return response;
    },
}

