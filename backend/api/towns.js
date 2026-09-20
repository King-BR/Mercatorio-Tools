const express = require("express");

const { client } = require("../discord/index.js");
const config = require("../discord/config.json");
const utils = require("../discord/utils.js");

const { getTowns, getTownByID, getTownByName } = require("../data/getters.js");

const router = express.Router();

// GET /api/towns/all
router.get("/all", async (req, res) => {
  try {
    const towns = await getTowns();
    res.json(Array.from(towns.values()));
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting towns: ${error.message}`,
    );
    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/towns/id/:townID
router.get("/id/:townID", async (req, res) => {
  try {
    const townID = req.params.townID;
    const town = await getTownByID(townID);
    if (!town) {
      res.status(404).json({ message: "Town not found" });
      return;
    }
    res.json(town);
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting town by ID: ${error.message}`,
    );
    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/towns/name/:townName
router.get("/name/:townName", async (req, res) => {
  try {
    const townName = req.params.townName;
    const town = await getTownByName(townName);
    if (!town) {
      res.status(404).json({ message: "Town not found" });
      return;
    }
    res.json(town);
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting town by name: ${error.message}`,
    );
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
