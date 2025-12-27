"use strict";
const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedAdminPassword = await bcrypt.hash("admin123", 10);
    const hashedUserPassword = await bcrypt.hash("user123", 10);

    await queryInterface.bulkInsert("users", [
      {
        username: "admin",
        name: "Administrator",
        email: "admin@esdm.go.id",
        password: hashedAdminPassword,
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "user",
        name: "User Demo",
        email: "user@esdm.go.id",
        password: hashedUserPassword,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", {
      email: ["admin@esdm.go.id", "user@esdm.go.id"],
    });
  },
};
