module.exports = (sequelize, DataTypes) => {
  const Biografi = sequelize.define(
    "Biografi",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
    },
    {
      tableName: "biografi",
      timestamps: true,
      underscored: false,
    }
  );

  // Define associations
  Biografi.associate = function (models) {
    // Association dengan translations
    Biografi.hasMany(models.BiografiTranslation, {
      foreignKey: "biografi_id",
      as: "translations",
    });
  };

  return Biografi;
};
