"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tema_publikasi", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    // Buat tabel tema_publikasi_translations
    await queryInterface.createTable("tema_publikasi_translations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      tema_publikasi_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "tema_publikasi",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      language_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "languages",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      nama: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    // Tambahkan unique constraint
    await queryInterface.addConstraint("tema_publikasi_translations", {
      fields: ["tema_publikasi_id", "language_id"],
      type: "unique",
      name: "unique_tema_publikasi_language",
    });

    // Tambahkan index untuk performa
    await queryInterface.addIndex("tema_publikasi_translations", [
      "language_id",
    ]);
    await queryInterface.addIndex("tema_publikasi_translations", [
      "tema_publikasi_id",
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("tema_publikasi_translations");
    await queryInterface.dropTable("tema_publikasi");
  },
};
