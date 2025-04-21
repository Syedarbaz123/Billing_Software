'use strict';

module.exports = (sequelize, DataTypes, Model) => {
    class UnitAdjustment extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
          
            UnitAdjustment.belongsTo(models.Meter, {
                foreignKey: {
					name:'MeterId',
					//type: DataTypes.BIGINT,
					allowNull: false
				},
                as: 'meter',
            });

        }
    }

    UnitAdjustment.init({
        docNo: { type: DataTypes.STRING, defaultValue: "" }, 
        docDate: DataTypes.DATE,
        fromDate: DataTypes.DATE,
        toDate: DataTypes.DATE,
        currentUnitsTonHour: DataTypes.DECIMAL(18,2),
        finalUnitsTonHour: DataTypes.DECIMAL(18,2),
        diffUnitsTonHour: DataTypes.DECIMAL(18,2),
        remarks: { type: DataTypes.STRING, defaultValue: "" },
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
    }, 
    {
        sequelize,
        timestamps: false, // ✅ timestamps disable kar diya
        tableName: 'UnitAdjustment',
        modelName: 'UnitAdjustment',
    });
    

    return UnitAdjustment;
};