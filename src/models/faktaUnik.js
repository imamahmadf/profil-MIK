module.exports = (sequelize, DataTypes) => {
  const FaktaUnik = sequelize.define(
    "FaktaUnik",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      angka: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "fakta_unik",
      timestamps: true,
      underscored: false,
    }
  );

  // Define associations
  FaktaUnik.associate = function (models) {
    // Association dengan translations
    FaktaUnik.hasMany(models.FaktaUnikTranslation, {
      foreignKey: "fakta_unik_id",
      as: "translations",
    });
  };

  return FaktaUnik;
};
