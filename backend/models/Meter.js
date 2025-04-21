'use strict';

module.exports = (sequelize, DataTypes, Model) => {
    class Meter extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {

            Meter.belongsTo(models.HistoryConfig, {
                foreignKey: 'history_config_id',
                as: 'historyConfig',
                allowNull: true
            });

            Meter.hasOne(models.Space, {
                foreignKey: 'meter_id',
                as: 'space'
            });

            Meter.hasMany(models.UnitAdjustment, {
                foreignKey: 'MeterId', // dont give foreignKey in hasMany relation
                as: 'unitAdjustments'
            });
        }
    }

    Meter.init({
        name: DataTypes.STRING,
        description: DataTypes.STRING,
        status: DataTypes.BOOLEAN,
        peakHourCalculation: { type: DataTypes.BOOLEAN, defaultValue: false },
        history_config_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // ✅ this is what matters!
        },
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
    }, {
        sequelize,
        tableName: 'meters',
        modelName: 'Meter',
        timestamps: false
    });

    return Meter;
};