const express = require("express");
const fs = require("fs");
const path = require("path")

const router = express.Router();

// GET /api/towns
router.get("/", (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

// GET /api/towns/:id
router.get("/:id", (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

// GET /api/towns/stats
router.get("/stats", (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

// GET /api/towns/:id/stats
router.get("/:id/stats", (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

module.exports = router;