const { body, validationResult } = require('express-validator');
const Space = require('../../models').Space;
const { Op } = require('sequelize')

exports.SpaceCreateRequest = [
    body('name')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid Space name entered.'),
    body('type')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid Space type entered.'),
    body('floor_id')
        .not().isEmpty()
        .withMessage('Floor is not selected'),
    body('meter_id')
        .not().isEmpty()
        .withMessage('Meter is not selected'),
    async (req, res, next) => {
        const errors = validationResult(req);
        const { name } = req.body;
        const space = await Space.findOne({
            where: {
                [Op.and]: [
                    { name: name },
                ]
            }
        });
        if (space) {
            return res.status(409).json({ message: 'Duplicate record found, please check.' }).send();
        }
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });
        else
            next();
    }
]