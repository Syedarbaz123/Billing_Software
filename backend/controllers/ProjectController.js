const db = require("../models");
const ProjectDetails = db.ProjectDetails;
const ActivityLogController = require('../controllers/ActivityLogController.js');

module.exports = {
    // GET project by id
    async project(req, res) {
        try {
          const id = req.params.id;
          const projectDetail = await ProjectDetails.findByPk(id);
      
          if (!projectDetail) {
            return res.status(404).json({ message: 'Project not found' });
          }
      
          return res.status(200).json(projectDetail);
        } catch (error) {
          console.error(error);
          return res.status(500).json({ message: 'Something went wrong' });
        }
      },      



    // UPDATE project by id
    async update(req, res) {
        try {
            const id = req.params.id;
            const { project_name, project_desc, project_img } = req.body;

            const project = await ProjectDetails.findByPk(id);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            project.set({
                project_name,
                project_desc,
                project_img
            });

            await project.save();

            // Log activity (optional)
            await ActivityLogController.create(
                'Update Project',
                `Project name = ${project_name} updated`,
                req.query.user_id
            );

            return res.status(200).json({ message: 'Project updated successfully', project });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Something went wrong' });
        }
    },
};
