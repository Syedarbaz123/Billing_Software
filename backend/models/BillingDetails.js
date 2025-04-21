'use strict';

module.exports = (sequelize, DataTypes, Model) => {
    class BillingDetails extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            BillingDetails.belongsTo(models.Billing, {
                foreignKey: {
                    name: 'BillingId',
                    //type: DataTypes.BIGINT,
                    allowNull: false
                },
                as: 'billing',
            });
            BillingDetails.belongsTo(models.Customer, {
                foreignKey: {
                    name: 'CID_web',
                    //type: DataTypes.BIGINT,
                    allowNull: true,
                },
                as: 'customer',
            });
        }
    }

    BillingDetails.init({
        RowNo: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        BillNo: { type: DataTypes.STRING, defaultValue: "", allowNull: false },
        PreviousReadingTonHour: DataTypes.DECIMAL(18, 2),
        CurrentReadingTonHour: DataTypes.DECIMAL(18, 2),
        UnitsConsumedTonHour: DataTypes.DECIMAL(18, 2),
        RatePerTonHour: DataTypes.DECIMAL(18, 2),
        Amount: DataTypes.DECIMAL(18, 2),
        OtherChargesText: { type: DataTypes.STRING, defaultValue: "" },
        OtherCharges: DataTypes.DECIMAL(18, 2),
        ArrearsText: { type: DataTypes.STRING, defaultValue: "" },
        Arrears: DataTypes.DECIMAL(18, 2),
        TotalAmount: DataTypes.DECIMAL(18, 2),
        claimedPer: DataTypes.DECIMAL(18, 3),
        TotalPayableAmount: DataTypes.DECIMAL(18, 2),
        FromDate: DataTypes.DATE,
        ToDate: DataTypes.DATE,
        ServiceChargesText: { type: DataTypes.STRING, defaultValue: "" },
        ServiceCharges: DataTypes.DECIMAL(18, 2),
        AdditionalChargesText: { type: DataTypes.STRING, defaultValue: "" },
        AdditionalCharges: DataTypes.DECIMAL(18, 2),
    },
        {
            sequelize,
            tableName: 'Billing_Details',
            modelName: 'BillingDetails',
            timestamps: false
        });
    return BillingDetails;
};