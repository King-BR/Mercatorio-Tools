const express = require("express");

const { getPrestigeBoard, getSustenance } = require("../data/getters.js");

const router = express.Router();

// GET /api/prestige/board
router.get("/board", (req, res) => {
  try {
    const data = getPrestigeBoard();

    // converto map to object {key: value}
    const objectData = Object.fromEntries(data); 

    res.json(objectData);
  } catch (error) {
    console.log("Error retrieving prestige board data:", error);
    res.status(500).json({
      message: "Error retrieving prestige board data",
      error: error,
    });
  }
});

// GET /api/prestige/board/:category
router.get("/board/:category", (req, res) => {
  try {
    const category = req.params.category.toLowerCase();
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
    console.log("Error retrieving prestige board data for category:", error);
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
    console.log("Error retrieving sustenance data:", error);
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
    console.log("Error retrieving sustenance data for category:", error);
    res.status(500).json({
      message: "Error retrieving sustenance data for category",
      error: error,
    });
  }
});

module.exports = router;
