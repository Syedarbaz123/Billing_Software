'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class HistoryConfig extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {

        }
    }

    HistoryConfig.init({
            ID: {
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            ID_: DataTypes.STRING,
            HISTORYNAME: DataTypes.STRING,
            SOURCE: DataTypes.STRING,
            SOURCEHANDLE: DataTypes.STRING,
            TIMEZONE: DataTypes.STRING,
            INTERVAL_: DataTypes.STRING,
            VALUEFACETS: DataTypes.STRING,
            TABLE_NAME: DataTypes.STRING,
            DB_TIMEZONE: DataTypes.STRING,
        },

        {
            sequelize,
            tableName: 'history_config',
            modelName: 'HistoryConfig',
            timestamps: false
        });
    return HistoryConfig;
};