module.exports = (sequelize, DataTypes) => {
  const BiografiTranslation = sequelize.define(
    "BiografiTranslation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      biografi_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "biografi",
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
      slogan: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "biografi_translations",
      timestamps: true,
      underscored: false,
    }
  );

  BiografiTranslation.associate = function (models) {
    BiografiTranslation.belongsTo(models.Biografi, {
      foreignKey: "biografi_id",
      as: "biografi",
    });
    BiografiTranslation.belongsTo(models.Language, {
      foreignKey: "language_id",
      as: "language",
    });
  };

  return BiografiTranslation;
};
