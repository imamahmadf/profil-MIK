module.exports = (sequelize, DataTypes) => {
  const Publikasi = sequelize.define(
    "Publikasi",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      foto: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tanggal: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      temaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "tema_publikasi",
          key: "id",
        },
      },
      link: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      tableName: "publikasi",
      timestamps: true,
      underscored: false,
    }
  );

  // Define associations
  Publikasi.associate = function (models) {
    // Association dengan translations
    Publikasi.hasMany(models.PublikasiTranslation, {
      foreignKey: "publikasi_id",
      as: "translations",
    });
    // Association dengan tema publikasi
    Publikasi.belongsTo(models.TemaPublikasi, {
      foreignKey: "temaId",
      as: "tema",
    });
  };

  return Publikasi;
};
