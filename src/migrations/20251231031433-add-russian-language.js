"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Cek apakah bahasa Rusia sudah ada
    const [existing] = await queryInterface.sequelize.query(
      "SELECT id FROM languages WHERE code = 'ru' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Jika belum ada, tambahkan bahasa Rusia
    if (!existing) {
      await queryInterface.bulkInsert("languages", [
        {
          code: "ru",
          name: "Russian",
          is_default: false,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  },

  async down(queryInterface, Sequelize) {
    // Hapus bahasa Rusia jika rollback
    await queryInterface.bulkDelete("languages", {
      code: "ru",
    });
  },
};
