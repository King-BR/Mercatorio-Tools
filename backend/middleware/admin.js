const jwt = require("jsonwebtoken");
const Users = require("../models/user.js");

const debug = process.argv.includes("--debug");

module.exports = async function (req, res, next) {
  const token =
    req.cookies?.token || req.body?.token || req.query?.token || null;
  const bearerToken = req.headers?.authorization?.split(" ")[1] || null;

  if (!token && !bearerToken) {
    return res
      .status(401)
      .json({ message: "No token or API key, authorization denied" });
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (debug) console.log("Decoded token:", decoded);

      const user = await Users.findById(decoded.user.id);

      if (!user) {
        return res.status(404).json({ message: "User not found/Unauthorized" });
      }

      if (!user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      req.user = user;

      next();
    } catch (err) {
      console.error("JWT authentication error:", err);
      res.status(401).json({ message: "Invalid token" });
    }
  } else if (bearerToken) {
    try {
      const user = await Users.findOne({ "apiKeys.key": bearerToken });

      if (!user) {
        return res.status(404).json({ message: "User not found/Unauthorized" });
      }

      if (!user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      req.apiKey = bearerToken;
      req.user = user;

      next();
    } catch (err) {
      console.error("API key authentication error:", err);
      res.status(401).json({ message: "Invalid API key" });
    }
  }
};
