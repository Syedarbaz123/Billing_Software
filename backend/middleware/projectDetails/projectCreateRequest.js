const {body, validationResult} = require('express-validator');
const ProjectDetails = require('../../models').ProjectDetails;
const {Op}=require('sequelize')
exports.ProjectDetailsUpdateRequest = [
    body('project_name')
        .not().isEmpty().trim().escape()
        .withMessage('Invalid Project name entered.'),
    // body('CoID')
    //     .not().isEmpty()
    //     .withMessage('Invalid Company'),
    async (req, res, next) => {
        let id = req.params.id;
        const errors = validationResult(req);
        const {project_name} = req.body;
        const projectDetails = await ProjectDetails.findOne({
            where: {
                [Op.and]: [
                    {project_name: project_name},
                    {id: 
                        {
                            [Op.ne]: id,
                        }
                    },
                ]
            }
        });
        if (projectDetails) {
            return res.status(409).json({message: 'Duplicate record found, please check.'}).send();
        }
        if (!errors.isEmpty())
            return res.status(422).json({errors: errors.array()});
        else
            next();
    }
]