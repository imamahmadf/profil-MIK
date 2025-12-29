module.exports = (sequelize, DataTypes) => {
  const Galeri = sequelize.define(
    "Galeri",
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
      foto: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "galeri",
      timestamps: true,
      underscored: false,
    }
  );

  return Galeri;
};
