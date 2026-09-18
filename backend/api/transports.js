const express = require("express");

const { client } = require("../discord/index.js");
const config = require("../discord/config.json");
const utils = require("../discord/utils.js");

const { getTransports, getTransportOperations } = require("../data/getters.js");

const router = express.Router();

// GET /api/transports
router.get("/", (req, res) => {
  try {
    const transports = getTransports();
    res.json(Array.from(transports.values()));
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting transports: ${error.message}`,
    );
    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/transports/category/:category
router.get("/category/:category", (req, res) => {
  try {
    const transports = getTransports();
    const category = req.params.category;
    const filteredTransports = Array.from(transports.values()).filter(
      (transport) => transport.category == category,
    );
    res.json(filteredTransports);
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting transports for category ${req.params.category}: ${error.message}`,
    );
    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/transports/operations
router.get("/operations", (req, res) => {
  try {
    const transportOperations = getTransportOperations();
    res.json(Array.from(transportOperations.values()));
  } catch (error) {
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting transport operations: ${error.message}`,
    );
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
