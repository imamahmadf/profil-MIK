module.exports = (sequelize, DataTypes) => {
  const Tentang = sequelize.define(
    "Tentang",
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
      tableName: "tentang",
      timestamps: true,
      underscored: false,
    }
  );

  // Define associations
  Tentang.associate = function (models) {
    // Association dengan translations
    Tentang.hasMany(models.TentangTranslation, {
      foreignKey: "tentang_id",
      as: "translations",
    });
  };

  return Tentang;
};
