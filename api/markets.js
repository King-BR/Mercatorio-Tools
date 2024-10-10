const express = require("express");
const fs = require("fs");
const path = require("path")

const router = express.Router();

// GET /api/markets
router.get("/", (req, res) => {
  const markets = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/markets.json"), "utf8"));
  res.json(markets);
});

// GET /api/markets/:id
router.get("/:id", (req, res) => {
  const markets = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/markets.json"), "utf8"));
  const market = markets.find(m => m.id === req.params.id);
  if (market) {
    res.json(market);
  } else {
    res.status(404).json({ message: "Market not found" });
  }
});

module.exports = router;