'use strict';

module.exports = (sequelize, DataTypes, Model) => {
    class Space extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            
            Space.belongsTo(models.Meter, {
                foreignKey: 'meter_id',
                as: 'meter'
            });

            Space.belongsTo(models.Floor, {
                foreignKey: 'floor_id',
                as: 'floor'
            });

            Space.hasOne(models.Customer, {
                foreignKey: 'SpID',
                as: 'customer'
            });

        }
    }

    Space.init({
        name: DataTypes.STRING,
        type: DataTypes.STRING,
        description: DataTypes.STRING,
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
    },
        {
            sequelize,
            tableName: 'spaces',
            modelName: 'Space',
            timestamps: false,
        });
    return Space;
};