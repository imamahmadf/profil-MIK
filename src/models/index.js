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
db.Hero = require("./hero")(sequelize, Sequelize.DataTypes);
db.HeroTranslation = require("./HeroTranslation")(
  sequelize,
  Sequelize.DataTypes
);
db.Testimoni = require("./testimoni")(sequelize, Sequelize.DataTypes);
db.TestimoniTranslation = require("./TestimoniTranslation")(
  sequelize,
  Sequelize.DataTypes
);
db.Biografi = require("./biografi")(sequelize, Sequelize.DataTypes);
db.BiografiTranslation = require("./BiografiTranslation")(
  sequelize,
  Sequelize.DataTypes
);
db.TemaPublikasi = require("./temaPublikasi")(sequelize, Sequelize.DataTypes);
db.TemaPublikasiTranslation = require("./TemaPublikasiTranslation")(
  sequelize,
  Sequelize.DataTypes
);
db.Publikasi = require("./publikasi")(sequelize, Sequelize.DataTypes);
db.PublikasiTranslation = require("./PublikasiTranslation")(
  sequelize,
  Sequelize.DataTypes
);
db.Pesan = require("./pesan")(sequelize, Sequelize.DataTypes);
db.Pengalaman = require("./pengalaman")(sequelize, Sequelize.DataTypes);
db.PengalamanTranslation = require("./PengalamanTranslation")(
  sequelize,
  Sequelize.DataTypes
);
db.KegiatanPengalaman = require("./kegiatanPengalaman")(
  sequelize,
  Sequelize.DataTypes
);
db.KegiatanPengalamanTranslation = require("./KegiatanPengalamanTranslation")(
  sequelize,
  Sequelize.DataTypes
);
db.Tentang = require("./tentang")(sequelize, Sequelize.DataTypes);
db.TentangTranslation = require("./TentangTranslation")(
  sequelize,
  Sequelize.DataTypes
);
db.FaktaUnik = require("./faktaUnik")(sequelize, Sequelize.DataTypes);
db.FaktaUnikTranslation = require("./FaktaUnikTranslation")(
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
