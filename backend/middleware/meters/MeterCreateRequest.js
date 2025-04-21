const { body, validationResult } = require('express-validator');
const Floor = require('../../models').Floor;
const Meter = require('../../models').Meter;
const { Op } = require('sequelize');

exports.MeterCreateRequest = [
    body('name')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid meter name entered.'),
    body('history_config_id')
        .not().isEmpty()
        .withMessage('Meter table is not selected'),

    async (req, res, next) => {
        console.log(req.body)
        const errors = validationResult(req);
        const { name } = req.body;
        let meter = await Meter.findOne({
            where: {
                [Op.and]: [
                    { name: name },

                ]
            }
        });
        if (meter) {
            return res.status(409).json({ message: 'Duplicate record found, please check.' }).send();
        }
        if (!errors.isEmpty()){
        console.log('ERROR!!!!!!!!!!!!!')    
            return res.status(422).json({ errors: errors.array() });
        }
        else
            next();
    }
]