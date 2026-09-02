const jwt = require("jsonwebtoken");
const Users = require("../models/user.js");

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
      req.user = decoded.user;
      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
    }
  } else if (bearerToken) {
    try {
      const user = await Users.findOne({ "apiKeys.key": bearerToken });
      if (!user) {
        throw new Error("Invalid api key");
      }

      req.apiKey = bearerToken;
      req.user = user;

      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid API key" });
    }
  }
};
