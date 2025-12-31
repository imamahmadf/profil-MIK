module.exports = (sequelize, DataTypes) => {
  const Berita = sequelize.define(
    "Berita",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      foto: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_published: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "berita",
      timestamps: true,
      underscored: false,
    }
  );

  // Define associations
  Berita.associate = function (models) {
    Berita.hasMany(models.FotoBerita, {
      foreignKey: "beritaId",
      as: "fotos",
    });

    // Association dengan translations
    Berita.hasMany(models.BeritaTranslation, {
      foreignKey: "berita_id",
      as: "translations",
    });
  };

  return Berita;
};
