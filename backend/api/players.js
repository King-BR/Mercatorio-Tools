const express = require("express");

const { client } = require("../discord/index.js");
const config = require("../discord/config.json");
const utils = require("../discord/utils.js");

const auth = require("../middleware/auth.js");
const { getPlayer, getPlayerInventory } = require("../data/getters.js");

const router = express.Router();

// GET /api/players/me
router.get("/me", auth, async (req, res) => {
  try {
    const userAuth = req.user.apiKeys.find(
      (keyData) =>
        keyData.keyType === "GAME" && keyData.permissions.includes("READ"),
    );

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

module.exports = router;
