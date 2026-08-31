const express = require("express");
const fs = require("fs");
const path = require("path");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/notifications/:id
router.get("/:id", auth, (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

// POST /api/notifications/:id/add
router.post("/:id/add", auth, (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

// POST /api/notifications/:id/delete/:notificationId
router.post("/:id/delete/:notificationId", auth, (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

module.exports = router;
