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
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Title cannot be empty"
                },
                len: {
                    args: [1, 255],
                    msg: "Title must be between 1 and 255 characters"
                }
            }
        },

        description: {
            type: DataTypes.TEXT
        },

        created_by: {
            type: DataTypes.UUID,
            allowNull: false
        },

        start_at: {
            type: DataTypes.DATE,
            allowNull: true
        },

        end_at: {
            type: DataTypes.DATE,
            allowNull: true,
            validate: {
                isAfterStart(value) {
                    if (this.start_at && value && value <= this.start_at) {
                        throw new Error("end_at must be after start_at");
                    }
                }
            }
        },

        settings: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        access_type: {
            type: DataTypes.ENUM('PUBLIC', 'LINK', 'PRIVATE'),
            defaultValue: 'PRIVATE'
        },
    }, {
        tableName: "surveys",
        timestamps: true,
        underscored: true,
        paranoid: true,
        indexes: [
            { fields: ["created_by"] },
            { fields: ["created_at"] },
            { fields: ["start_at"] },
            { fields: ["end_at"] }
        ]
    });

    return Survey;
};