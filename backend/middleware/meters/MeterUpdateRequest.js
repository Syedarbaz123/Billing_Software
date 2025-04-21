const { body, validationResult } = require('express-validator');
const Floor = require('../../models').Floor;
const Meter = require('../../models').Meter;
const { Op } = require('sequelize');
exports.MeterUpdateRequest = [
    body('name')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid building name entered.'),
    body('history_config_id')
        .not().isEmpty()
        .withMessage('Meter table is not selected'),

    async (req, res, next) => {
        let id = req.params.id;
        const errors = validationResult(req);
        const { name, history_config_id } = req.body;
        let meter = await Meter.findOne({
            where: {
                [Op.and]: [
                    { name: name },
                    {
                        id:
                        {
                            [Op.ne]: id,
                        }
                    },
                ]
            }
        });
        if (meter && meter.id != id) {
            return res.status(409).json({ message: 'Duplicate record found, please check.' }).send();
        }
        let errs = errors.array();
        const disabledMeter = await Meter.findOne({
            where: {
                history_config_id: history_config_id,
                status: true
            }
        })

        if (disabledMeter && disabledMeter.id != id)
            errs.push({
                msg: 'History table is already attached to some other meter.',
                param: 'history_config_id'
            })
        if (errs.length > 0)
            return res.status(422).json({ errors: errs });
        else
            next();
    }
]