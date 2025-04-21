'use strict';

module.exports = (sequelize, DataTypes, Model) => {
    class Building extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Building.hasMany(models.Floor, {
                foreignKey: 'building_id',
                as: 'floor'
            });
        }
    }

    Building.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        tableName: 'buildings',
        modelName: 'Building',
        timestamps: false, // Agar createdAt & updatedAt nahi chahiye to
    });

    return Building;
};
