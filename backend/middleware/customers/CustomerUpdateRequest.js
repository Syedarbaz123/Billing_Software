const {body, validationResult} = require('express-validator');
const Space = require('../../models').Space;
const {Op} = require('sequelize')
exports.customerUpdateRequest = [
    body('CName')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid name'),
    body('Code')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid code'),
    body('space')
        .not().isEmpty()
        .withMessage('Space is not selected'),

    // async (req, res, next) => {
    //     let CId = req.params.id;
    //     const errors = validationResult(req);
    //     console.log("body..........", req.body);
        
    //     const {CName, status, enable_date, disable_date, space} = req.body;
    //     // const oldCustomer = await Customer.findOne({
    //     //     where: {
    //     //         [Op.and]: [
    //     //             {CName: CName},
    //     //             {CId: 
    //     //                 {
    //     //                     [Op.ne]: CId,
    //     //                 }
    //     //             },
    //     //         ]
    //     //     }
    //     // });
    //     // if (oldCustomer && oldCustomer.CId != CId)
    //     //     return res.status(409).json({message: 'Duplicate record found, please check.'}).send();

    //     let errs = errors.array();
    //     // if (status) {
    //     //     if (enable_date == null || enable_date == '') {
    //     //         errs.push({
    //     //             msg: 'Enable date is not selected',
    //     //             param: 'enable_date'
    //     //         })
    //     //     }
    //     // } else {
    //     //     if (disable_date == null || disable_date == '') {
    //     //         errs.push({
    //     //             msg: 'Disable date is not selected',
    //     //             param: 'disable_date'
    //     //         })
    //     //     }
    //     // }

    //     if (space == null) {
    //         errs.push({
    //             msg: 'No space is selected',
    //             param: 'space'
    //         })
    //     } else {
    //         let space = await Space.findAll({
    //             where: {
    //                 id: space,
    //                 status: false,
    //             }
    //         })
    //         if (space.length > 0) {
    //             errs.push({
    //                 msg: 'Selected space is disabled',
    //                 param: 'space'
    //             })
    //         }
    //     }
    //     if (errs.length) {
    //         return res.status(422).json({errors: errs});
    //     } else
    //         next();
    // },
]