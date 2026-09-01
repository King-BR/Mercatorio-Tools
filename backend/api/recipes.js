const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// GET /api/recipes
router.get("/", (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

// GET /api/recipes/:id
router.get("/:id", (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

// GET /api/recipes/input/:id
router.get("/input/:id", (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

// GET /api/recipes/output/:id
router.get("/output/:id", (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

module.exports = router;
