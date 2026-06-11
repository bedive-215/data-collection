require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DB_URL,
    dialect: "mysql",
    dialectOptions: {
      multipleStatements: true
    }
  },
  test: {
    url: process.env.DB_URL,
    dialect: 'mysql',
    logging: false,
  },
  production: {
    url: process.env.DB_URL,
    dialect: 'mysql',
    logging: false,
  },
};