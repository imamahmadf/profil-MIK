module.exports = (sequelize, DataTypes) => {
  const BeritaTranslation = sequelize.define(
    "BeritaTranslation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      berita_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "berita",
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
      isi: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      meta_title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      meta_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "berita_translations",
      timestamps: true,
      underscored: false,
    }
  );

  BeritaTranslation.associate = function (models) {
    BeritaTranslation.belongsTo(models.Berita, {
      foreignKey: "berita_id",
      as: "berita",
    });
    BeritaTranslation.belongsTo(models.Language, {
      foreignKey: "language_id",
      as: "language",
    });
  };

  return BeritaTranslation;
};
