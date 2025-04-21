const {body, validationResult} = require('express-validator');
const User = require('../../models').User;
exports.userUpdateRequest = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address.'),
    body('username')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid username.'),
    body('role_id')
        .not().isEmpty()
        .withMessage('Role is not selected'),
    body('name')
        .not().isEmpty().trim().escape()
        .withMessage('Enter a valid name'),

    async (req, res, next) => {
        const errors = validationResult(req);
        let errs = errors.array();
        let {password, confirm_password} = req.body;
        let passwordError = false;
        if (password && password !== confirm_password) {
            passwordError = true;
        }
        if (password.length < 6) {
            errs.push({
                msg: "Password minimum length should be 6 digit.",
                param: "password",
            })
        }
        if (confirm_password.length < 6) {
            errs.push({
                msg: "Password minimum length should be 6 digit.",
                param: "confirm_password",
            })
        }

        let id = req.params.id;
        const {username} = req.body;
        const oldUser = await User.findOne({
            where: {
                username: username
            }
        });
        if (oldUser && oldUser.id != id)
            return res.status(409).json({message: 'Another user already registered with this username.'}).send();
        if (!errors.isEmpty() || passwordError) {
            if (passwordError) {
                errs.push({
                    msg: "Confirm password do not match",
                    param: "confirm_password",
                })
            }

            return res.status(422).json({errors: errs});
        } else
            next();
    },
]