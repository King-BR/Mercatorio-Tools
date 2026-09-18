const express = require("express");

const { client } = require("../discord/index.js");
const config = require("../discord/config.json");
const utils = require("../discord/utils.js");

const { getPaths, getFerries } = require("../data/getters.js");

const router = express.Router();

// GET /api/pathfinding/paths
router.get("/paths", (req, res) => {
  try {
    const paths = getPaths();
    res.status(200).json(Array.from(paths.values()));
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting paths: ${error.message}`,
    );

    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/pathfinding/ferries
router.get("/ferries", (req, res) => {
  try {
    const ferries = getFerries();
    res.status(200).json(Array.from(ferries.values()));
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting ferries: ${error.message}`,
    );

    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
