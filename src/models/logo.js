module.exports = (sequelize, DataTypes) => {
  const Logo = sequelize.define(
    "Logo",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      jenisLogoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "jenis_logo",
          key: "id",
        },
      },
      gambarLogo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "logo",
      timestamps: true,
      underscored: false,
    }
  );

  // Define associations
  Logo.associate = function (models) {
    // Association dengan jenis logo
    Logo.belongsTo(models.JenisLogo, {
      foreignKey: "jenisLogoId",
      as: "jenisLogo",
    });
  };

  return Logo;
};

