import { Sequelize } from "sequelize";
// Biến môi trường do bootstrap-env.js (import đầu tiên từ server.js) nạp từ backend/.env
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