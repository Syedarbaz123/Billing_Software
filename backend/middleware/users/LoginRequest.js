const { body, validationResult } = require('express-validator');
exports.loginRequest = [
    body('username')
        .not()
        .isEmpty()
        .withMessage('Invalid username'),
    body('password').isLength({
        min: 6
    }).withMessage('Password should be at least 6 chars long.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() });
        next();
    },
];