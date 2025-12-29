module.exports = (sequelize, DataTypes) => {
  const FotoBerita = sequelize.define(
    "FotoBerita",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      beritaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "berita",
          key: "id",
        },
      },
      foto: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      urutan: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      tableName: "foto_berita",
      timestamps: true,
      underscored: false,
    }
  );

  return FotoBerita;
};
