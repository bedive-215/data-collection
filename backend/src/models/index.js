import sequelize from "../configs/db.config.js";
import UserModel from "./user.model.js";
import UserOAuthModel from "./userOauth.model.js";


const User = UserModel(sequelize);
const UserOAuth = UserOAuthModel(sequelize);

// Define associations
User.hasMany(UserOAuth, { foreignKey: "user_id", as: "oauth_providers" });
UserOAuth.belongsTo(User, { foreignKey: "user_id", as: "user" });

const models = {
    User,
    UserOAuth
};

export default models;