module.exports = (sequelize, DataTypes) => {
  const RekamJejak = sequelize.define(
    "RekamJejak",
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
      foto: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "rekam_jejak",
      timestamps: true,
      underscored: false,
    }
  );

  return RekamJejak;
};
