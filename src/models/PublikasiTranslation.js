module.exports = (sequelize, DataTypes) => {
  const PublikasiTranslation = sequelize.define(
    "PublikasiTranslation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      publikasi_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "publikasi",
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
      judul: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      ringkasan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "publikasi_translations",
      timestamps: true,
      underscored: false,
    }
  );

  PublikasiTranslation.associate = function (models) {
    PublikasiTranslation.belongsTo(models.Publikasi, {
      foreignKey: "publikasi_id",
      as: "publikasi",
    });
    PublikasiTranslation.belongsTo(models.Language, {
      foreignKey: "language_id",
      as: "language",
    });
  };

  return PublikasiTranslation;
};
