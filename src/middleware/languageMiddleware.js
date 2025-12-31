const { Language } = require("../models");

const languageMiddleware = async (req, res, next) => {
  try {
    // Priority: query param > header > default
    let langCode =
      req.query.lang ||
      req.headers["accept-language"]?.split(",")[0]?.split("-")[0] ||
      "id";

    // Validasi bahasa
    const language = await Language.findOne({
      where: { code: langCode, is_active: true },
    });

    if (!language) {
      // Fallback ke default language
      const defaultLang = await Language.findOne({
        where: { is_default: true, is_active: true },
      });
      req.language = defaultLang || { code: "id", id: 1 };
    } else {
      req.language = language;
    }

    next();
  } catch (error) {
    console.error("Error in languageMiddleware:", error);
    // Fallback ke default jika error
    req.language = { code: "id", id: 1 };
    next();
  }
};

module.exports = languageMiddleware;
