module.exports = (sequelize, DataTypes) => {
  const FaktaUnikTranslation = sequelize.define(
    "FaktaUnikTranslation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fakta_unik_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "fakta_unik",
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
      satuan: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      isi: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "fakta_unik_translations",
      timestamps: true,
      underscored: false,
    }
  );

  FaktaUnikTranslation.associate = function (models) {
    FaktaUnikTranslation.belongsTo(models.FaktaUnik, {
      foreignKey: "fakta_unik_id",
      as: "faktaUnik",
    });
    FaktaUnikTranslation.belongsTo(models.Language, {
      foreignKey: "language_id",
      as: "language",
    });
  };

  return FaktaUnikTranslation;
};
