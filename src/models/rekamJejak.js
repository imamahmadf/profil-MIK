module.exports = (sequelize, DataTypes) => {
  const RekamJejak = sequelize.define(
    "RekamJejak",
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
    },
    {
      tableName: "rekam_jejak",
      timestamps: true,
      underscored: false,
    }
  );

  // Define associations
  RekamJejak.associate = function (models) {
    // Association dengan translations
    RekamJejak.hasMany(models.RekamJejakTranslation, {
      foreignKey: "rekam_jejak_id",
      as: "translations",
    });
  };

  return RekamJejak;
};
