const { sequelize, Sequelize } = require("../database");

const db = {
  sequelize,
  Sequelize,
};

// Import dan inisialisasi models
db.User = require("./User")(sequelize, Sequelize.DataTypes);
db.Berita = require("./berita")(sequelize, Sequelize.DataTypes);
db.FotoBerita = require("./FotoBerita")(sequelize, Sequelize.DataTypes);
db.Galeri = require("./galeri")(sequelize, Sequelize.DataTypes);
db.RekamJejak = require("./rekamJejak")(sequelize, Sequelize.DataTypes);

// Define associations
db.Berita.associate(db);
db.FotoBerita.associate = function (models) {
  db.FotoBerita.belongsTo(models.Berita, {
    foreignKey: "beritaId",
    as: "berita",
  });
};

module.exports = db;
