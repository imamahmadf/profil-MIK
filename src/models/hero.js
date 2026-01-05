module.exports = (sequelize, DataTypes) => {
  const Hero = sequelize.define(
    "Hero",
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
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "hero",
      timestamps: true,
      underscored: false,
    }
  );

  // Define associations
  Hero.associate = function (models) {
    // Association dengan translations
    Hero.hasMany(models.HeroTranslation, {
      foreignKey: "hero_id",
      as: "translations",
    });
  };

  return Hero;
};
