const express = require("express");
const fs = require("fs");
const path = require("path");

const { cacheDuration } = require("../data/config.js");

const router = express.Router();

var lastBuildingsUpdate = null;
var lastBuildingsDescUpdate = null;
var lastUpgradesUpdate = null;
var lastUpgradesDescUpdate = null;
var buildingsData = new Map();
var buildingsDescData = new Map();
var upgradesData = new Map();
var upgradesDescData = new Map();

function getBuildings() {
  const now = Date.now();

  if (lastBuildingsUpdate && now - lastBuildingsUpdate < cacheDuration) {
    return buildingsData;
  }

  const filePath = path.join(__dirname, "../data/buildings.json");
  const data = fs.readFileSync(filePath, "utf8");
  const buildings = JSON.parse(data);

  buildingsData.clear();
  buildings.forEach((building) => buildingsData.set(building.type, building));

  lastBuildingsUpdate = now;
  return buildingsData;
}

function getBuildingsDescriptions() {
  const now = Date.now();

  if (
    lastBuildingsDescUpdate &&
    now - lastBuildingsDescUpdate < cacheDuration
  ) {
    return buildingsDescData;
  }

  const filePath = path.join(__dirname, "../data/buildings_desc.json");
  const data = fs.readFileSync(filePath, "utf8");
  const buildingsDesc = JSON.parse(data);

  buildingsDescData.clear();
  Object.entries(buildingsDesc).forEach(([type, description]) =>
    buildingsDescData.set(type, description),
  );

  lastBuildingsDescUpdate = now;
  return buildingsDescData;
}

function getUpgrades() {
  const now = Date.now();

  if (lastUpgradesUpdate && now - lastUpgradesUpdate < cacheDuration) {
    return upgradesData;
  }

  const buildings = Array.from(getBuildings().values());

  upgradesData.clear();
  buildings.forEach((building) => {
    if (building.upgrades) {
      building.upgrades.forEach((upgrade) =>
        upgradesData.set(upgrade.type, upgrade),
      );
    }
  });

  lastUpgradesUpdate = now;
  return upgradesData;
}

function getUpgradesDescriptions() {
  const now = Date.now();

  if (lastUpgradesDescUpdate && now - lastUpgradesDescUpdate < cacheDuration) {
    return upgradesDescData;
  }

  const filePath = path.join(__dirname, "../data/upgrades_desc.json");
  const data = fs.readFileSync(filePath, "utf8");
  const upgradesDesc = JSON.parse(data);

  upgradesDescData.clear();
  Object.entries(upgradesDesc).forEach(([type, description]) =>
    upgradesDescData.set(type, description),
  );

  lastUpgradesDescUpdate = now;
  return upgradesDescData;
}

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
