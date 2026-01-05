module.exports = (sequelize, DataTypes) => {
  const KegiatanPengalamanTranslation = sequelize.define(
    "KegiatanPengalamanTranslation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      kegiatan_pengalaman_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "kegiatan_pengalaman",
          key: "id",
        },
      },
      language_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "languages",
          key: "id",
        },
      },
      kegiatan: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "kegiatan_pengalaman_translations",
      timestamps: true,
      underscored: false,
    }
  );

  KegiatanPengalamanTranslation.associate = function (models) {
    KegiatanPengalamanTranslation.belongsTo(models.KegiatanPengalaman, {
      foreignKey: "kegiatan_pengalaman_id",
      as: "kegiatanPengalaman",
    });
    KegiatanPengalamanTranslation.belongsTo(models.Language, {
      foreignKey: "language_id",
      as: "language",
    });
  };

  return KegiatanPengalamanTranslation;
};
