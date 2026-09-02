const express = require("express");
const UsersDB = require("../models/user.js");
const router = express.Router();

// GET /api/users
router.get("/", async (req, res) => {
  try {
    var users = await UsersDB.find();
    var usersJson = users.map((user) => user.toJSON());

    res.json(usersJson);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  try {
    var user = await UsersDB.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.toJSON());
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
