const { sequelize, Sequelize } = require("../database");

const db = {
  sequelize,
  Sequelize,
};

// Import dan inisialisasi models
db.User = require("./User")(sequelize, Sequelize.DataTypes);
db.Language = require("./Language")(sequelize, Sequelize.DataTypes);
db.Berita = require("./berita")(sequelize, Sequelize.DataTypes);
db.BeritaTranslation = require("./BeritaTranslation")(
  sequelize,
  Sequelize.DataTypes
);
db.FotoBerita = require("./FotoBerita")(sequelize, Sequelize.DataTypes);
db.Galeri = require("./galeri")(sequelize, Sequelize.DataTypes);
db.RekamJejak = require("./rekamJejak")(sequelize, Sequelize.DataTypes);
db.RekamJejakTranslation = require("./RekamJejakTranslation")(
  sequelize,
  Sequelize.DataTypes
);

// Define associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Define FotoBerita association
db.FotoBerita.associate = function (models) {
  db.FotoBerita.belongsTo(models.Berita, {
    foreignKey: "beritaId",
    as: "berita",
  });
};

module.exports = db;
