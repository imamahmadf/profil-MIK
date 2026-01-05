module.exports = (sequelize, DataTypes) => {
  const Pesan = sequelize.define(
    "Pesan",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nama: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      kontak: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      judul: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      pesan: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("new", "read", "replied"),
        defaultValue: "new",
        allowNull: false,
      },
    },
    {
      tableName: "pesan",
      timestamps: true,
      underscored: false,
    }
  );

  return Pesan;
};
