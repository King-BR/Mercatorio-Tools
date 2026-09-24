const express = require("express");

const { client } = require("../discord/index.js");
const config = require("../discord/config.json");
const utils = require("../discord/utils.js");

const auth = require("../middleware/auth.js");
const {
  getPlayer,
  getPlayerInventory,
  getBuilding,
} = require("../data/getters.js");

const router = express.Router();

// GET /api/players/me
router.get("/me", auth, async (req, res) => {
  try {
    const userAuth = req.user.apiKeys.find(
      (keyData) =>
        keyData.keyType === "GAME" && keyData.permissions.includes("READ"),
    );

    if (!userAuth) {
      return res.status(403).json({ error: "No valid API key found" });
    }

    const player = await getPlayer(req, {
      user: userAuth?.mercUser || null,
      apiKey: userAuth?.key || null,
    });
    res.json(player);
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting player data: ${error.message}`,
    );

    res.status(500).json({ error: "Failed to fetch player data" });
  }
});

// GET /api/players/me/inventory
router.get("/me/inventory", auth, async (req, res) => {
  try {
    const userAuth = req.user.apiKeys.find(
      (keyData) =>
        keyData.keyType === "GAME" && keyData.permissions.includes("READ"),
    );

    if (!userAuth) {
      return res.status(403).json({ error: "No valid API key found" });
    }

    const player = await getPlayer(req, {
      user: userAuth?.mercUser || null,
      apiKey: userAuth?.key || null,
    });

    const inventory = await getPlayerInventory(req, player, {
      user: userAuth?.mercUser || null,
      apiKey: userAuth?.key || null,
    });
    res.json(inventory);
  } catch (error) {
    console.error("Error getting player inventory data:", error);

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting player inventory data: ${error.message}`,
    );

    res
      .status(500)
      .json({ message: "Failed to fetch player inventory data", error });
  }
});

// GET /api/players/me/buildings
router.get("/me/buildings", auth, async (req, res) => {
  try {
    const userAuth = req.user.apiKeys.find(
      (keyData) =>
        keyData.keyType === "GAME" && keyData.permissions.includes("READ"),
    );

    if (!userAuth) {
      return res.status(403).json({ error: "No valid API key found" });
    }

    const player = await getPlayer(req, {
      user: userAuth?.mercUser || null,
      apiKey: userAuth?.key || null,
    });

    const operationsIDs = player.household?.operations || [];
    const buildingsIDs = operationsIDs.filter(
      (operation) =>
        operation.includes("producer") || operation.includes("storage"),
    );

    res.json(buildingsIDs);
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting player buildings data: ${error.message}`,
    );

    res
      .status(500)
      .json({ message: "Failed to fetch player buildings data", error });
  }
});

// GET /api/players/me/buildings/all
router.get("/me/buildings/all", auth, async (req, res) => {
  try {
    const userAuth = req.user.apiKeys.find(
      (keyData) =>
        keyData.keyType === "GAME" && keyData.permissions.includes("READ"),
    );

    if (!userAuth) {
      return res.status(403).json({ error: "No valid API key found" });
    }

    const player = await getPlayer(req, {
      user: userAuth?.mercUser || null,
      apiKey: userAuth?.key || null,
    });

    const operationsIDs = player.household?.operations || [];
    const buildingsIDs = operationsIDs
      .filter(
        (operation) =>
          operation.includes("producer") || operation.includes("storage"),
      )
      .map((operation) => operation.split("/").pop());

    const buildings = [];

    for (const buildingID of buildingsIDs) {
      const building = await getBuilding(req, buildingID, {
        user: userAuth?.mercUser || null,
        apiKey: userAuth?.key || null,
      });
      buildings.push(building);
    }

    res.json(buildings);
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting player buildings data: ${error.message}`,
    );

    res
      .status(500)
      .json({ message: "Failed to fetch player buildings data", error });
  }
});

// GET /api/players/me/buildings/id/:id
router.get("/me/buildings/id/:id", auth, async (req, res) => {
  try {
    const userAuth = req.user.apiKeys.find(
      (keyData) =>
        keyData.keyType === "GAME" && keyData.permissions.includes("READ"),
    );

    if (!userAuth) {
      return res.status(403).json({ error: "No valid API key found" });
    }

    const player = await getPlayer(req, {
      user: userAuth?.mercUser || null,
      apiKey: userAuth?.key || null,
    });

    const buildingId = req.params.id;
    const buildingsIDs = player.household?.operations || [];
    const building = buildingsIDs.find((operation) => operation === buildingId);

    if (!building) {
      return res.status(404).json({ message: "Building not found" });
    }

    res.json(building);
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting player building data: ${error.message}`,
    );

    res
      .status(500)
      .json({ message: "Failed to fetch player building data", error });
  }
});

module.exports = router;
