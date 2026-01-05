module.exports = (sequelize, DataTypes) => {
  const Testimoni = sequelize.define(
    "Testimoni",
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
      tableName: "testimoni",
      timestamps: true,
      underscored: false,
    }
  );

  // Define associations
  Testimoni.associate = function (models) {
    // Association dengan translations
    Testimoni.hasMany(models.TestimoniTranslation, {
      foreignKey: "testimoni_id",
      as: "translations",
    });
  };

  return Testimoni;
};
