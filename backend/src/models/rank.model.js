import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Rank = sequelize.define("Rank", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        icon: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        color: {
            type: DataTypes.STRING(20),
            defaultValue: "#9E9E9E",
        },
        min_stars: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        max_stars: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        bonus_multiplier: {
            type: DataTypes.DECIMAL(3, 2),
            defaultValue: 1.0,
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        order_index: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    }, {
        tableName: "ranks",
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ["min_stars"] },
            { fields: ["order_index"] },
        ],
    });

    return Rank;
};
