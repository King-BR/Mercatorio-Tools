const express = require("express");
const UsersDB = require("../models/user.js");
const auth = require("../middleware/auth.js");
const admin = require("../middleware/admin.js");
const router = express.Router();

// GET /api/users
router.get("/", auth, admin, async (req, res) => {
  try {
    const users = await UsersDB.find();
    const usersJson = users.map((user) => user.toJSON());

    res.json(usersJson);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/:id
router.get("/:id", auth, admin, async (req, res) => {
  try {
    const user = await UsersDB.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.toJSON());
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
