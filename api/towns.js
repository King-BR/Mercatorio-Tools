const express = require("express");
const fs = require("fs");
const path = require("path")

const router = express.Router();

// GET /api/towns
router.get("/", (req, res) => {
  const towns = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/towns.json"), "utf8"));
  res.json(towns);
});

// GET /api/towns/:id
router.get("/:id", (req, res) => {
  const towns = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/towns.json"), "utf8"));
  const town = towns.find(t => t.id === req.params.id);
  if (town) {
    res.json(town);
  } else {
    res.status(404).json({ message: "Town not found" });
  }
});

// GET /api/towns/stats
router.get("/stats", (req, res) => {
  const stats = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/towns_stats.json"), "utf8"));
  res.json(stats);
});

// GET /api/towns/:id/stats
router.get("/:id/stats", (req, res) => {
  const stats = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/towns_stats.json"), "utf8"));
  const townStats = stats.find(s => s.id === req.params.id);
  if (townStats) {
    res.json(townStats);
  } else {
    res.status(404).json({ message: "Town stats not found" });
  }
});

module.exports = router;