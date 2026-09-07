const express = require("express");
const fs = require("fs");
const path = require("path");

const { cacheDuration } = require("../data/config.js");

const router = express.Router();

var prestigeBoardData = new Map();
var sustenanceData = new Map();
var lastBoardCache = null;
var lastSustenanceCache = null;

function getPrestigeBoard() {
  var now = Date.now();

  if (!lastBoardCache || now - lastBoardCache > cacheDuration) {
    prestigeBoardData.clear();
    const data = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../data/prestige_board_levels.json"),
        "utf8",
      ),
    );
    data.forEach((item) => {
      prestigeBoardData.set(item.category.toLowerCase(), item);
    });

    lastBoardCache = now;
  }

  return prestigeBoardData;
}

function getSustenance() {
  var now = Date.now();

  if (!lastSustenanceCache || now - lastSustenanceCache > cacheDuration) {
    sustenanceData.clear();
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/sustenance.json"), "utf8"),
    );

    data.forEach((item) => {
      sustenanceData.set(item.category.toLowerCase(), item);
    });

    lastSustenanceCache = now;
  }

  return sustenanceData;
}

// GET /api/prestige/board
router.get("/board", (req, res) => {
  try {
    res.json(getPrestigeBoard());
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving prestige board data",
      error: error,
    });
  }
});

// GET /api/prestige/board/:category
router.get("/board/:category", (req, res) => {
  try {
    const category = req.params.category;
    const data = getPrestigeBoard();
    var filteredData = null;
    const categories = Array.from(data.keys());

    if (categories.includes(category)) {
      filteredData = data.get(category);
    } else {
      res.status(404).json({
        message:
          "Category not found, available categories are on the categories property",
        categories,
      });
      return;
    }

    res.json(filteredData);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving prestige board data for category",
      error: error,
    });
  }
});

// GET /api/prestige/sustenance
router.get("/sustenance", (req, res) => {
  try {
    res.json(getSustenance());
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving sustenance data",
      error: error,
    });
  }
});

// GET /api/prestige/sustenance/:category
router.get("/sustenance/:category", (req, res) => {
  try {
    const category = req.params.category.toLowerCase();
    const data = getSustenance();
    var filteredData = null;
    const categories = Array.from(data.keys());

    if (categories.includes(category)) {
      filteredData = data.get(category);
    } else {
      res.status(404).json({
        message:
          "Category not found, available categories are on the categories property",
        categories,
      });
      return;
    }

    res.json(filteredData);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving sustenance data for category",
      error: error,
    });
  }
});

module.exports = router;
