module.exports = (sequelize, DataTypes) => {
  const Language = sequelize.define(
    "Language",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING(5),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "languages",
      timestamps: true,
      underscored: false,
    }
  );

  Language.associate = function (models) {
    // Associations akan ditambahkan di model translation
  };

  return Language;
};
