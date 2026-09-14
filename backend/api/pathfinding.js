const express = require("express");

const { getPaths, getFerries } = require("../data/getters.js");

const router = express.Router();

// GET /api/pathfinding/paths
router.get("/paths", (req, res) => {
  try {
    const paths = getPaths();
    res.status(200).json(Array.from(paths.values()));
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/pathfinding/ferries
router.get("/ferries", (req, res) => {
  try {
    const ferries = getFerries();
    res.status(200).json(Array.from(ferries.values()));
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
