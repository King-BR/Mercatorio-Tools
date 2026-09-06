const express = require("express");
const fs = require("fs");
const path = require("path");

const { cacheDuration } = require("../data/config.js");

const router = express.Router();

var transportsData = new Map();
var transportOperationsData = new Map();
var lastTransportUpdate = null;
var lastTransportRecipesUpdate = null;

function getTransports() {
  const now = Date.now();

  if (lastTransportUpdate && now - lastTransportUpdate < cacheDuration) {
    return transportsData;
  }

  const filePath = path.join(__dirname, "../data/transports.json");
  const data = fs.readFileSync(filePath, "utf8");
  const transports = JSON.parse(data);

  transportsData.clear();
  transports.forEach((transport) =>
    transportsData.set(transport.type, transport),
  );

  lastTransportUpdate = now;
  return transportsData;
}

function getTransportOperations() {
  const now = Date.now();

  if (
    lastTransportRecipesUpdate &&
    now - lastTransportRecipesUpdate < cacheDuration
  ) {
    return transportOperationsData;
  }

  const filePath = path.join(__dirname, "../data/transport_recipes.json");
  const data = fs.readFileSync(filePath, "utf8");
  const transportOperations = JSON.parse(data);

  transportOperationsData.clear();
  transportOperations.forEach((operation) =>
    transportOperationsData.set(operation.name, operation),
  );

  lastTransportRecipesUpdate = now;
  return transportOperationsData;
}

// GET /api/transports
router.get("/", (req, res) => {
  try {
    const transports = getTransports();
    res.json(Array.from(transports.values()));
  } catch (error) {
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
    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/transports/operations
router.get("/operations", (req, res) => {
  try {
    const transportOperations = getTransportOperations();
    res.json(Array.from(transportOperations.values()));
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
