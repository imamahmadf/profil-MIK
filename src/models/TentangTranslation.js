module.exports = (sequelize, DataTypes) => {
  const TentangTranslation = sequelize.define(
    "TentangTranslation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tentang_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tentang",
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
    },
    {
      tableName: "tentang_translations",
      timestamps: true,
      underscored: false,
    }
  );

  TentangTranslation.associate = function (models) {
    TentangTranslation.belongsTo(models.Tentang, {
      foreignKey: "tentang_id",
      as: "tentang",
    });
    TentangTranslation.belongsTo(models.Language, {
      foreignKey: "language_id",
      as: "language",
    });
  };

  return TentangTranslation;
};
