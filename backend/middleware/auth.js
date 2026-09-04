const jwt = require("jsonwebtoken");
const Users = require("../models/user.js");

const debug = process.argv.includes("--debug"); 

module.exports = async function (req, res, next) {
  const token =
    req.cookies?.token || req.body?.token || req.query?.token || null;

  if (debug) console.log("Token from cookies/body/query:", token);

  const authorization = req.headers?.authorization || null;

  if (debug) console.log("Authorization header:", authorization);

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

      if (debug) console.log("Decoded token:", decoded);

      /*
       * O auth.js cria o token neste formato:
       *
       * {
       *   user: {
       *     id: "..."
       *   }
       * }
       */

      if (!decoded.user?.id) {
        return res.status(401).json({
          message: "Invalid token",
        });
      }

      const user = await Users.findById(decoded.user.id);

      if (debug) console.log("User found from decoded token:", user);

      if (!user) {
        return res.status(401).json({
          message: "User not found/Unauthorized",
        });
      }

      req.user = user;

      return next();
    } catch (err) {
      console.error("JWT authentication error:", err);

      return res.status(401).json({
        message: "Invalid token",
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

      return next();
    } catch (err) {
      console.error("API key authentication error:", err);

      return res.status(401).json({
        message: "Invalid API key",
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
