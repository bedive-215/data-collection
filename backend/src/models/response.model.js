import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Response = sequelize.define("Response", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        survey_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "surveys",
                key: "id"
            },
            onDelete: "CASCADE"
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: "users",
                key: "id"
            },
            onDelete: "SET NULL"
        }
    }, {
        tableName: "responses",
        timestamps: true,
        underscored: true
    });

    return Response;
};