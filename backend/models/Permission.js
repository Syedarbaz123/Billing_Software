'use strict';

module.exports = (sequelize, DataTypes, Model) => {
    class Permission extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {

        }
    }

    Permission.init({
            name: DataTypes.STRING,
            uq_key: DataTypes.STRING,
            group_name: DataTypes.STRING,
        },
        {
            sequelize,
            tableName: 'permissions',
            modelName: 'Permission',
            timestamps: false,
        });
    return Permission;
};