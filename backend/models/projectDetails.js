'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProjectDetails extends Model {}

  ProjectDetails.init({
    project_img: {
      type: DataTypes.STRING,
      allowNull: true
    },
    project_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    project_desc: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    tableName: 'project_details',
    modelName: 'ProjectDetails',
    timestamps: false, // disable createdAt, updatedAt fields
  });

  return ProjectDetails;
};
