import { Sequelize } from "sequelize";
import "dotenv/config"
// URL format:
// mysql://username:password@host:port/database

const sequelize = new Sequelize(
  process.env.DB_URL,
  {
    dialect: "mysql",
    logging: false,
    timezone: '+07:00'
  }
);

export default sequelize;