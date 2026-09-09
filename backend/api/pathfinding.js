const express = require("express");

const { getPaths } = require("../data/getters.js");

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

// GET /api/pathfinding/paths/:id
router.get("/paths/:id", (req, res) => {
  try {
    const paths = getPaths();
    const path = paths.get(req.params.id);

    if (!path) {
      return res.status(404).json({ message: "Path not found" });
    }

    res.status(200).json(path);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
