const express = require("express");
const fs = require("fs");
const path = require("path");

const { cacheDuration } = require("../data/config.js");

const router = express.Router();

var pathsCache = new Map();
var lastPathsCacheUpdate = null;

function getPaths() {
  const now = Date.now();
  if (!lastPathsCacheUpdate || now - lastPathsCacheUpdate > cacheDuration) {
    const paths = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/paths.json"), "utf-8"),
    );

    pathsCache = new Map(paths.map((p) => [p.id, p]));
    lastPathsCacheUpdate = now;
  }

  return pathsCache;
}

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
