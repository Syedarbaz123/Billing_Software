const {body, validationResult} = require('express-validator');
const Role = require('../../models').Role;
exports.RoleCreateRequest = [
    body('name')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid role name entered'),
    async (req, res, next) => {
        const errors = validationResult(req);
        const {name} = req.body;
        const role = await Role.findOne({
            where: {
                name: name
            }
        });
        if (role)
            return res.status(409).json({message: 'Duplicate record found, please check.'});
        if (!errors.isEmpty())
            return res.status(422).json({errors: errors.array()});
        else
            next();
    }
]