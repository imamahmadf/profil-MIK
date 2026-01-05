module.exports = (sequelize, DataTypes) => {
  const HeroTranslation = sequelize.define(
    "HeroTranslation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      hero_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "hero",
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
      slogan: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isi: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "hero_translations",
      timestamps: true,
      underscored: false,
    }
  );

  HeroTranslation.associate = function (models) {
    HeroTranslation.belongsTo(models.Hero, {
      foreignKey: "hero_id",
      as: "hero",
    });
    HeroTranslation.belongsTo(models.Language, {
      foreignKey: "language_id",
      as: "language",
    });
  };

  return HeroTranslation;
};
