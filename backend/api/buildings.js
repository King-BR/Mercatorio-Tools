const express = require("express");

const { client } = require("../discord/index.js");
const config = require("../discord/config.json");
const utils = require("../discord/utils.js");

const {
  getBuildings,
  getBuildingTypes,
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
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting buildings: ${error.message}`,
    );

    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/buildings/types
router.get("/types", (req, res) => {
  try {
    const buildingTypes = getBuildingTypes();
    res.json(buildingTypes);
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting building types: ${error.message}`,
    );

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
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting building descriptions: ${error.message}`,
    );

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
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting upgrade descriptions: ${error.message}`,
    );

    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
