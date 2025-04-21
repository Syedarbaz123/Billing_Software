const {body, validationResult} = require('express-validator');
const UnitAdjustment = require('../../models').UnitAdjustment;
const {Op} = require('sequelize')

const isValidDate = (value) => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  };

exports.UnitAdjustmentCreateRequest = [
    body('MeterId')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid meter'),
    body('docNo')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid document name'),
    body('fromDate')
        .custom(isValidDate)
        .withMessage('Invalid from date'),
    body('toDate')
        .custom(isValidDate)
        .withMessage('Invalid to date'),
    // body('currentUnitsTonHour')
    //     .isNumeric()
    //     .withMessage('Invalid current units ton-hour')
    //     .custom((currentUnitsTonHour) => currentUnitsTonHour >= 0)
    //     .withMessage('Current Units value must not be less than zero'),
    body('finalUnitsTonHour')
        .isNumeric()
        .withMessage('Invalid final units ton-hour')
        .custom((finalUnitsTonHour) => finalUnitsTonHour >= 0)
        .withMessage('Final Units value must not be less than zero'),
  
    async (req, res, next) => {
        const errors = validationResult(req);
        const {docNo} = req.body;
        const unitAdjustment = await UnitAdjustment.findOne({
            where: {
                [Op.and]: [
                    {docNo: docNo},
                ]
            }
        });
        if (unitAdjustment) {
            return res.status(409).json({message: 'Duplicate record found, please check.', code:'docNo'}).send();
        }
        if (!errors.isEmpty())
            return res.status(422).json({errors: errors.array()});
        else
            next();
    }
]