import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Survey = sequelize.define("Survey", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id"
            },
            onDelete: "CASCADE"
        }
    }, {
        tableName: "surveys",
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ["created_at"]
            }
        ]
    });

    return Survey;
};