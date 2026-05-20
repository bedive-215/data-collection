import { DataTypes } from "sequelize";

export default (sequelize) => {
    const DailyCheckin = sequelize.define("DailyCheckin", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
            onDelete: "CASCADE",
        },
        checkin_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        stars_earned: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        streak_count: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        multiplier: {
            type: DataTypes.DECIMAL(3, 2),
            defaultValue: 1.0,
        },
        ip_address: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        device_info: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    }, {
        tableName: "daily_checkins",
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ["user_id", "checkin_date"], unique: true },
            { fields: ["user_id"] },
            { fields: ["checkin_date"] },
        ],
    });

    return DailyCheckin;
};
