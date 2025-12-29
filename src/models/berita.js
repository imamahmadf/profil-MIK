module.exports = (sequelize, DataTypes) => {
  const Berita = sequelize.define(
    "Berita",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      judul: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isi: {
        type: DataTypes.TEXT,
        allowNull: false,
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
  };

  return Berita;
};
