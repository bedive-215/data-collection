import { DataTypes } from "sequelize";

export default (sequelize) => {
    const UserAchievement = sequelize.define("UserAchievement", {
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
        achievement_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "achievements",
                key: "id",
            },
            onDelete: "CASCADE",
        },
        progress: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        is_unlocked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        unlocked_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        notification_sent: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    }, {
        tableName: "user_achievements",
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ["user_id", "achievement_id"], unique: true },
            { fields: ["user_id"] },
            { fields: ["achievement_id"] },
        ],
    });

    return UserAchievement;
};
