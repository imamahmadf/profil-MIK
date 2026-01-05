"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pengalaman", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      durasi: {
        type: Sequelize.STRING(255),
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

    // Buat tabel pengalaman_translations
    await queryInterface.createTable("pengalaman_translations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      pengalaman_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "pengalaman",
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
      posisi: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      instansi: {
        type: Sequelize.STRING(255),
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

    // Buat tabel kegiatan_pengalaman
    await queryInterface.createTable("kegiatan_pengalaman", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      pengalaman_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "pengalaman",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      urutan: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
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

    // Buat tabel kegiatan_pengalaman_translations
    await queryInterface.createTable("kegiatan_pengalaman_translations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      kegiatan_pengalaman_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "kegiatan_pengalaman",
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
      kegiatan: {
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
    await queryInterface.addConstraint("pengalaman_translations", {
      fields: ["pengalaman_id", "language_id"],
      type: "unique",
      name: "unique_pengalaman_language",
    });

    await queryInterface.addConstraint("kegiatan_pengalaman_translations", {
      fields: ["kegiatan_pengalaman_id", "language_id"],
      type: "unique",
      name: "unique_kegiatan_pengalaman_language",
    });

    // Tambahkan index untuk performa
    await queryInterface.addIndex("pengalaman_translations", ["language_id"]);
    await queryInterface.addIndex("pengalaman_translations", ["pengalaman_id"]);
    await queryInterface.addIndex("kegiatan_pengalaman", ["pengalaman_id"]);
    await queryInterface.addIndex("kegiatan_pengalaman_translations", [
      "language_id",
    ]);
    await queryInterface.addIndex("kegiatan_pengalaman_translations", [
      "kegiatan_pengalaman_id",
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("kegiatan_pengalaman_translations");
    await queryInterface.dropTable("kegiatan_pengalaman");
    await queryInterface.dropTable("pengalaman_translations");
    await queryInterface.dropTable("pengalaman");
  },
};
