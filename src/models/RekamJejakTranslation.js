module.exports = (sequelize, DataTypes) => {
  const RekamJejakTranslation = sequelize.define(
    "RekamJejakTranslation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      rekam_jejak_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "rekam_jejak",
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
      tableName: "rekam_jejak_translations",
      timestamps: true,
      underscored: false,
    }
  );

  RekamJejakTranslation.associate = function (models) {
    RekamJejakTranslation.belongsTo(models.RekamJejak, {
      foreignKey: "rekam_jejak_id",
      as: "rekamJejak",
    });
    RekamJejakTranslation.belongsTo(models.Language, {
      foreignKey: "language_id",
      as: "language",
    });
  };

  return RekamJejakTranslation;
};
