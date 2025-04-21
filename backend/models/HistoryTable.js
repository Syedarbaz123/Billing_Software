'use strict';

module.exports = (sequelize, DataTypes, Model) => {
    class HistoryTable extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {

        }
    }

    HistoryTable.init({
            HistoryTableId: {
                type: DataTypes.BIGINT,
                primaryKey: true,
            },
            TableName: {
                type: DataTypes.STRING,
                allowNull: false
            }
        },

        {
            sequelize,
            tableName: 'historytable',
            modelName: 'HistoryTable',
            timestamps: false
        });
    return HistoryTable;
};