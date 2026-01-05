module.exports = (sequelize, DataTypes) => {
  const TestimoniTranslation = sequelize.define(
    "TestimoniTranslation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      testimoni_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "testimoni",
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
      nama: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      isi: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      tempat: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "testimoni_translations",
      timestamps: true,
      underscored: false,
    }
  );

  TestimoniTranslation.associate = function (models) {
    TestimoniTranslation.belongsTo(models.Testimoni, {
      foreignKey: "testimoni_id",
      as: "testimoni",
    });
    TestimoniTranslation.belongsTo(models.Language, {
      foreignKey: "language_id",
      as: "language",
    });
  };

  return TestimoniTranslation;
};
