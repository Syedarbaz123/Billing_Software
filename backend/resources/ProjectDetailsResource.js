const ProjectDetailsResource = async (projectdetails) => {
    return {
        id: projectdetails.id,
        project_img: projectdetails.project_img,
        project_name: projectdetails.project_name,
        project_desc: projectdetails.project_desc,
    };
};

module.exports = ProjectDetailsResource;
