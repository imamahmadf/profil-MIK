module.exports = (sequelize, DataTypes) => {
  const PengalamanTranslation = sequelize.define(
    "PengalamanTranslation",
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
      language_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "languages",
          key: "id",
        },
      },
      posisi: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      instansi: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "pengalaman_translations",
      timestamps: true,
      underscored: false,
    }
  );

  PengalamanTranslation.associate = function (models) {
    PengalamanTranslation.belongsTo(models.Pengalaman, {
      foreignKey: "pengalaman_id",
      as: "pengalaman",
    });
    PengalamanTranslation.belongsTo(models.Language, {
      foreignKey: "language_id",
      as: "language",
    });
  };

  return PengalamanTranslation;
};
