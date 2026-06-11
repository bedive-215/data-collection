import { type } from "os";
import { DataTypes} from "sequelize";

export default (sequelize) => {
    const User = sequelize.define("User", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        full_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        gender: {
            type: DataTypes.ENUM("MALE", "FEMALE", "OTHER"),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        avatar: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        avatar_public_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        phone_number: {
            type: DataTypes.STRING(20),
            unique: true,
            allowNull: true
        },
        role: {
            type: DataTypes.ENUM("user", "admin"),
            allowNull: false,
            defaultValue: "user",
        },
        date_of_birth: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        email_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        refresh_token: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        refresh_token_expires_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        verification_code: {
            type: DataTypes.STRING(6),
            allowNull: true,
        },
        verification_code_expires_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        last_verification_code_sent_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        password_reset_code: {
            type: DataTypes.STRING(6),
            allowNull: true,
        },
        password_reset_code_expires_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        // ── Gamification fields ──────────────────────────────────
        star_balance: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        total_stars_earned: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        current_rank: {
            type: DataTypes.STRING(50),
            defaultValue: "BRONZE",
        },
        streak_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        last_checkin_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        highest_streak: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        weekly_stars: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        monthly_stars: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        weekly_stars_updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        monthly_stars_updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        },
        blocked_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        block_reason: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
    }, {
        tableName: "users",
        timestamps: true,
        underscored: true,
    });

    return User;
};