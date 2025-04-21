'use strict';

module.exports = (sequelize, DataTypes, Model) => {
    class Role extends Model {
        static associate(models) {
            Role.hasMany(models.User, {
                foreignKey: 'role_id',
                as: 'user',
            });
        }
    }

    Role.init({
            name: DataTypes.STRING,
            description: DataTypes.STRING,
            key: DataTypes.STRING,
            created_by: DataTypes.INTEGER,
            updated_by: DataTypes.INTEGER,
            permissions: {
                type: DataTypes.TEXT,
                allowNull: false,
                defaultValue: '[]',  // Default empty array
                get() {
                    const rawValue = this.getDataValue('permissions');
                    return rawValue ? JSON.parse(rawValue) : []; // Ensure JSON parse
                },
                set(value) {
                    this.setDataValue('permissions', JSON.stringify(value));
                }
            }
            
        },
        {
            sequelize,
            tableName: 'roles',
            modelName: 'Role',
            timestamps: false  // ✅ Disable createdAt & updatedAt
        });
    return Role;
};
