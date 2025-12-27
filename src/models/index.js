const { sequelize, Sequelize } = require("../database");

const db = {
  sequelize,
  Sequelize,
};

// Import dan inisialisasi models
db.User = require("./User")(sequelize, Sequelize.DataTypes);

module.exports = db;
