const {body, validationResult} = require('express-validator');
const User = require('../../models').User;
const bcrypt = require('bcryptjs');
exports.changePassword = [
    body('old_password').not().isEmpty(),
    body('password')
        .isLength({min: 6})
        .withMessage('Password minimum length should be 6 digit.')
        .custom((value, {req, loc, path}) => {
            if (value !== req.body.confirm_password) {
                throw new Error("Confirm password do not match");
            } else {
                return value;
            }
        }),
    async (req, res, next) => {
        const errors = validationResult(req);
        let errs = errors.array();
        const {old_password} = req.body;
        let user = req.user;
        user = await User.findOne({
            where: {
                username: user.username
            }
        });
        let shouldProceed = false;
        if (user && (await bcrypt.compare(old_password, user.password))) {
            if (errors.isEmpty()) {
                shouldProceed = true;
            }
        } else {
            errs.push({
                msg: 'Invalid old password',
                param: 'old_password',
                location: 'body',
                value: old_password
            })
        }
        if (!shouldProceed)
            return res.status(422).json({errors: errs});
        next();
    },
];
