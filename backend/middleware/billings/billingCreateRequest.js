const {body, validationResult} = require('express-validator');
const Billing = require('../../models').Billing;
const {Op} = require('sequelize')
exports.BillingCreateRequest = [
    body('DocNo')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid document name'),
    body('DocDate')
        .isDate()
        .withMessage('Invalid billing month'),
    body('IssueDate')
        .isDate()
        .withMessage('Invalid issue date'),
    body('DueDate')
        .isDate()
        .withMessage('Invalid due date'),
    body('fromDate')
        .isDate()
        .withMessage('Invalid from date'),
    body('toDate')
        .isDate()
        .withMessage('Invalid to date'),
    body('RatePerTonHour')
        .isNumeric()
        .withMessage('Invalid rate / ton-hour'),
    // body('billingDetails')
    //     .isArray()
    //     .custom(value => value.length > 0)
    //     .withMessage('Invalid billing details object'),
    async (req, res, next) => {
        const errors = validationResult(req);
        const {DocNo} = req.body;
        const billing = await Billing.findOne({
            where: {
                [Op.and]: [
                    {DocNo: DocNo},
                ]
            }
        });
        if (billing) {
            return res.status(409).json({message: 'Duplicate record found, please check.', code:'DocNo'}).send();
        }
        if (!errors.isEmpty())
            return res.status(422).json({errors: errors.array()});
        else
            next();
    }
]