import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Achievement = sequelize.define("Achievement", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        code: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        icon: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        category: {
            type: DataTypes.ENUM(
                "SURVEY_CREATION",
                "PARTICIPATION",
                "STREAK",
                "SOCIAL",
                "SPECIAL",
                "RANK"
            ),
            allowNull: false,
        },
        star_reward: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        tier: {
            type: DataTypes.ENUM("BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"),
            defaultValue: "BRONZE",
        },
        condition_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        condition_value: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    }, {
        tableName: "achievements",
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ["code"], unique: true },
            { fields: ["category"] },
            { fields: ["is_active"] },
        ],
    });

    return Achievement;
};
