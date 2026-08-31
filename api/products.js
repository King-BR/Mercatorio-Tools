const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// GET /api/products
router.get("/", (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

module.exports = router;
