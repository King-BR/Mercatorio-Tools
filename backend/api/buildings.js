const express = require("express");

const {
  getBuildings,
  getBuildingsDescriptions,
  getUpgrades,
  getUpgradesDescriptions,
} = require("../data/getters.js");

const router = express.Router();

// GET /api/buildings
router.get("/", (req, res) => {
  try {
    const buildings = getBuildings();
    res.json(Array.from(buildings.values()));
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/buildings/descriptions
router.get("/descriptions", (req, res) => {
  try {
    const buildingsDesc = getBuildingsDescriptions();
    res.json(
      Array.from(buildingsDesc.entries()).map(([type, description]) => ({
        type,
        description,
      })),
    );
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/buildings/upgrades
router.get("/upgrades", (req, res) => {
  const upgrades = getUpgrades();
  res.json(Array.from(upgrades.values()));
});

// GET /api/buildings/upgrades/descriptions
router.get("/upgrades/descriptions", (req, res) => {
  try {
    const upgradesDesc = getUpgradesDescriptions();
    res.json(
      Array.from(upgradesDesc.entries()).map(([type, description]) => ({
        type,
        description,
      })),
    );
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
