const jwt = require("jsonwebtoken");
const Users = require("../models/user.js");

const debug = process.argv.includes("--debug");

module.exports = async function (req, res, next) {
  const token = req.cookies?.token || null;

  const authorization = req.headers?.authorization || null;

  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.split(" ")[1]
    : null;

  /*
   * ==========================================
   * JWT TOKEN
   * ==========================================
   */

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.user?.id) {
        return res.status(401).json({
          message: "Invalid token",
        });
      }

      const user = await Users.findById(decoded.user.id);

      if (!user) {
        return res.status(401).json({
          message: "User not found/Unauthorized",
        });
      }

      req.user = user;

      if (debug) {
        console.log(
          `[AUTH] JWT authenticated user: ${user.discord.globalName}`,
        );
      }

      return next();
    } catch (error) {
      console.error("[AUTH] JWT authentication error:", error);

      return res.status(500).json({
        message: "Server error",
        error,
      });
    }
  }

  /*
   * ==========================================
   * API KEY
   * ==========================================
   */

  if (bearerToken) {
    try {
      const user = await Users.findOne({
        "apiKeys.key": bearerToken,
      });

      if (!user) {
        return res.status(401).json({
          message: "Invalid API key",
        });
      }

      req.apiKey = bearerToken;
      req.user = user;

      if (debug) {
        console.log(
          `[AUTH] API key authenticated user: ${user.discord.globalName}`,
        );
      }

      return next();
    } catch (error) {
      console.error("[AUTH] API key authentication error:", error);

      return res.status(500).json({
        message: "Server error",
        error,
      });
    }
  }

  /*
   * ==========================================
   * NO AUTHENTICATION
   * ==========================================
   */

  return res.status(401).json({
    message: "No token or API key, authorization denied",
  });
};
