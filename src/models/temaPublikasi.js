module.exports = (sequelize, DataTypes) => {
  const TemaPublikasi = sequelize.define(
    "TemaPublikasi",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    },
    {
      tableName: "tema_publikasi",
      timestamps: true,
      underscored: false,
    }
  );

  // Define associations
  TemaPublikasi.associate = function (models) {
    // Association dengan translations
    TemaPublikasi.hasMany(models.TemaPublikasiTranslation, {
      foreignKey: "tema_publikasi_id",
      as: "translations",
    });
    // Association dengan publikasi
    TemaPublikasi.hasMany(models.Publikasi, {
      foreignKey: "temaId",
      as: "publikasi",
    });
  };

  return TemaPublikasi;
};
