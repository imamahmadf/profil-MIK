module.exports = (sequelize, DataTypes) => {
  const KegiatanPengalaman = sequelize.define(
    "KegiatanPengalaman",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      pengalaman_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "pengalaman",
          key: "id",
        },
      },
      urutan: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      tableName: "kegiatan_pengalaman",
      timestamps: true,
      underscored: false,
    }
  );

  // Define associations
  KegiatanPengalaman.associate = function (models) {
    // Association dengan pengalaman
    KegiatanPengalaman.belongsTo(models.Pengalaman, {
      foreignKey: "pengalaman_id",
      as: "pengalaman",
    });
    // Association dengan translations
    KegiatanPengalaman.hasMany(models.KegiatanPengalamanTranslation, {
      foreignKey: "kegiatan_pengalaman_id",
      as: "translations",
    });
  };

  return KegiatanPengalaman;
};
