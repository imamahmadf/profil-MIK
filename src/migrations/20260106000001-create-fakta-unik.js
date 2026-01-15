"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("fakta_unik", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      angka: {
        type: Sequelize.INTEGER,
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

    // Buat tabel fakta_unik_translations
    await queryInterface.createTable("fakta_unik_translations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      fakta_unik_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "fakta_unik",
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
      satuan: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      isi: {
        type: Sequelize.TEXT,
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
    await queryInterface.addConstraint("fakta_unik_translations", {
      fields: ["fakta_unik_id", "language_id"],
      type: "unique",
      name: "unique_fakta_unik_language",
    });

    // Tambahkan index untuk performa
    await queryInterface.addIndex("fakta_unik_translations", ["language_id"]);
    await queryInterface.addIndex("fakta_unik_translations", ["fakta_unik_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("fakta_unik_translations");
    await queryInterface.dropTable("fakta_unik");
  },
};
