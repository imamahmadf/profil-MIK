module.exports = (sequelize, DataTypes) => {
  const TemaPublikasiTranslation = sequelize.define(
    "TemaPublikasiTranslation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tema_publikasi_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tema_publikasi",
          key: "id",
        },
      },
      language_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "languages",
          key: "id",
        },
      },
      nama: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      tableName: "tema_publikasi_translations",
      timestamps: true,
      underscored: false,
    }
  );

  TemaPublikasiTranslation.associate = function (models) {
    TemaPublikasiTranslation.belongsTo(models.TemaPublikasi, {
      foreignKey: "tema_publikasi_id",
      as: "temaPublikasi",
    });
    TemaPublikasiTranslation.belongsTo(models.Language, {
      foreignKey: "language_id",
      as: "language",
    });
  };

  return TemaPublikasiTranslation;
};
