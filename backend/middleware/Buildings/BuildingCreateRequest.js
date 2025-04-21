const { body, validationResult } = require('express-validator');
const Building = require('../../models').Building;
const { Op } = require('sequelize');

exports.BuildingCreateRequest = [
    body('name')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid building name entered.'),
    
    async (req, res, next) => {
        const errors = validationResult(req);
        const { name } = req.body;
        const building = await Building.findOne({
            where: {
                [Op.and]: [
                    { name: name },
                ]
            }
        });

        if (building) {
            return res.status(409).json({ message: 'Duplicate record found, please check.' }).send();
        }

        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });
        else
            next();
    }
];
