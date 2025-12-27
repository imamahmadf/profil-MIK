const { Sequelize } = require("sequelize");
const dbConfig = require("../config/database");
const { env } = require("../config");

const config = dbConfig[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
  }
);

const db = {
  sequelize,
  Sequelize,
};

// Models akan diinisialisasi di models/index.js untuk menghindari circular dependency

module.exports = db;
