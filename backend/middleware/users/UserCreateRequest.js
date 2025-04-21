const { body, validationResult } = require('express-validator');
// const {Op} = require("sequelize");
const User = require('../../models').User;
exports.userCreateRequest = [
    body('password')
        .isLength({ min: 6 })
        .custom((value, { req, loc, path }) => {
            if (value !== req.body.confirm_password) {
                throw new Error("Confirm password do not match");
            } else {
                return value;
            }
        }),
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
        const { username } = req.body;
        console.log(req.body)
        const oldUser = await User.findOne({
            where: {
                username: username
            }
        });
        if (oldUser)
            return res.status(409).json({ message: 'Duplicate record found, please check.' }).send();
        if (!errors.isEmpty()) {
            console.log('error')
            return res.status(422).json({ errors: errors.array() });
        }
        else
            next();

    },
]