const {body, validationResult} = require('express-validator');
const Floor = require('../../models').Floor;
const {Op}=require('sequelize')
exports.FloorUpdateRequest = [
    body('name')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid building name entered.'),
    // body('CoID')
    //     .not().isEmpty()
    //     .withMessage('Invalid Company'),
    async (req, res, next) => {
        let id = req.params.id;
        const errors = validationResult(req);
        const {name} = req.body;
        const floor = await Floor.findOne({
            where: {
                [Op.and]: [
                    {name: name},
                    {id: 
                        {
                            [Op.ne]: id,
                        }
                    },
                ]
            }
        });
        if (floor) {
            return res.status(409).json({message: 'Duplicate record found, please check.'}).send();
        }
        if (!errors.isEmpty())
            return res.status(422).json({errors: errors.array()});
        else
            next();
    }
]