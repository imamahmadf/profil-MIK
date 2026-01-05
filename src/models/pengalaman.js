module.exports = (sequelize, DataTypes) => {
  const Pengalaman = sequelize.define(
    "Pengalaman",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      durasi: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "pengalaman",
      timestamps: true,
      underscored: false,
    }
  );

  // Define associations
  Pengalaman.associate = function (models) {
    // Association dengan translations
    Pengalaman.hasMany(models.PengalamanTranslation, {
      foreignKey: "pengalaman_id",
      as: "translations",
    });
    // Association dengan kegiatan pengalaman
    Pengalaman.hasMany(models.KegiatanPengalaman, {
      foreignKey: "pengalaman_id",
      as: "kegiatans",
    });
  };

  return Pengalaman;
};
