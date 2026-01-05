"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("publikasi", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      foto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tanggal: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      temaId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "tema_publikasi",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      link: {
        type: Sequelize.STRING(500),
        allowNull: true,
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

    // Buat tabel publikasi_translations
    await queryInterface.createTable("publikasi_translations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      publikasi_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "publikasi",
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
      judul: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      ringkasan: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.addConstraint("publikasi_translations", {
      fields: ["publikasi_id", "language_id"],
      type: "unique",
      name: "unique_publikasi_language",
    });

    // Tambahkan index untuk performa
    await queryInterface.addIndex("publikasi_translations", ["language_id"]);
    await queryInterface.addIndex("publikasi_translations", ["publikasi_id"]);
    await queryInterface.addIndex("publikasi", ["temaId"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("publikasi_translations");
    await queryInterface.dropTable("publikasi");
  },
};
