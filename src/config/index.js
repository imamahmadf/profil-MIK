const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 7000,
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_DATABASE || "database_development",
    user: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
  },
  whitelistedDomain: process.env.WHITELISTED_DOMAIN
    ? process.env.WHITELISTED_DOMAIN.split(",")
    : "*",
  jwtSecret: process.env.JWT_SECRET || "rahasiaya",
};
