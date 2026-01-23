module.exports = (sequelize, DataTypes) => {
  const JenisLogo = sequelize.define(
    "JenisLogo",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nama: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "jenis_logo",
      timestamps: true,
      underscored: false,
    }
  );

  // Define associations
  JenisLogo.associate = function (models) {
    // Association dengan logo
    JenisLogo.hasMany(models.Logo, {
      foreignKey: "jenisLogoId",
      as: "logos",
    });
  };

  return JenisLogo;
};

