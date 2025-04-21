const {body, validationResult} = require('express-validator');
const User = require('../../models').User;
exports.ProfileUpdateRequest = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address.'),
    body('username')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid username.'),
    body('name')
        .not().isEmpty().trim().escape()
        .withMessage('Enter a valid name'),
    async (req, res, next) => {
        const errors = validationResult(req);
        const user = req.user;
        const oldUser = await User.findByPk(user.user_id);
        console.log("OLD USER " + JSON.stringify(oldUser))
        console.log("LOG USER " + JSON.stringify(user))
        if (oldUser && user.username != oldUser.username)
            return res.status(409).json({message: 'Another user already registered with this username.'}).send();
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        } else
            next();
    },
]