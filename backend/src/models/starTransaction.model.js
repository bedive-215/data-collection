import { DataTypes } from "sequelize";

export default (sequelize) => {
    const StarTransaction = sequelize.define("StarTransaction", {
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
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM(
                "DAILY_CHECKIN",
                "CREATE_SURVEY",
                "RESPOND_SURVEY",
                "FIRST_RESPONDER",
                "SECOND_RESPONDER",
                "THIRD_RESPONDER",
                "LATER_RESPONDER",
                "SURVEY_CREATOR_BONUS",
                "BONUS",
                "PENALTY",
                "ADMIN_ADJUST",
                "REFERRAL_BONUS",
                "STREAK_BONUS",
                "ACHIEVEMENT_REWARD",
                "RANK_UP_BONUS"
            ),
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
        },
        balance_after: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        ref_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        ref_type: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        is_reversed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    }, {
        tableName: "star_transactions",
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ["user_id"] },
            { fields: ["type"] },
            { fields: ["created_at"] },
            { fields: ["ref_id", "ref_type"] },
        ],
    });

    return StarTransaction;
};
