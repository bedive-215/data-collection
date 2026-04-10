import { DataTypes } from "sequelize";

export default (sequelize) => {
  const UserOAuth = sequelize.define("UserOAuth", {
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
        key: "id"
      },
      onDelete: "CASCADE"
    },
    provider_uid: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  }, {
    tableName: "user_oauth_providers",
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ["provider_uid"], name: "uniq_provider_uid" },
      { fields: ["user_id"], name: "idx_user_id" },
    ],
  });

  return UserOAuth;
};