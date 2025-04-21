'use strict';

module.exports = (sequelize, DataTypes, Model) => {
    class Billing extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Billing.belongsTo(models.User, {
                foreignKey: {
                    name: 'TransUID',
                    //DataTypes.BIGINT,
                    allowNull: false
                },
                as: 'user',
            });

            Billing.hasMany(models.BillingDetails, {
                foreignKey: 'BillingId',
                as: 'billingDetails',
            });

        }
    }

    Billing.init({
        BillingId: {
            type: DataTypes.BIGINT,
            //autoIncrement: true,
            primaryKey: true,
        },
        DocNo: { type: DataTypes.STRING, defaultValue: "" },
        DocDate: DataTypes.DATE,
        fromDate: DataTypes.DATE,
        toDate: DataTypes.DATE,
        RatePerTonHour: DataTypes.DECIMAL(18, 2),
        BoardMsg: { type: DataTypes.STRING, defaultValue: "" },
        headingText: { type: DataTypes.STRING, allowNull: false, defaultValue: "" },
        IssueDate: DataTypes.DATE,
        DueDate: DataTypes.DATE,
        Remarks: { type: DataTypes.STRING, defaultValue: "" },
        //            CoID: {type:DataTypes.INTEGER, defaultValue: 1},
        //            TransUID: DataTypes.BIGINT,
        TransDate: DataTypes.DATE,
    },

        {
            sequelize,
            tableName: 'Billing',
            modelName: 'Billing',
            timestamps: true,
            updatedAt: 'TransDate'
        });
    return Billing;
};