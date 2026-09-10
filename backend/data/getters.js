const fs = require("fs");
const path = require("path");

const config = require("./config.js");
const cacheDuration = config.cacheDuration; // 2 hours
const minuteUpdate = 6;

// Buildings data
var lastBuildingsUpdate = null;
var lastBuildingsDescUpdate = null;
var lastUpgradesUpdate = null;
var lastUpgradesDescUpdate = null;
var buildingsData = new Map();
var buildingsDescData = new Map();
var upgradesData = new Map();
var upgradesDescData = new Map();

// Market data
const MARKET_DATA_URL = "https://api.mercatorio-tools.tech/data/marketdata";
const marketData = new Map();
const marketCacheDuration = 10 * 60 * 1000; // 10 minutes
var lastMarketCache = null;

// Products data
const productsCache = new Map();
var lastProductsCache = null;

// Pathfinding data
const pathsCache = new Map();
var lastPathsCacheUpdate = null;

// Prestige data
const prestigeBoardData = new Map();
const sustenanceData = new Map();
var lastBoardCache = null;
var lastSustenanceCache = null;

// Recipes data
const recipesCache = new Map();
var lastRecipesUpdate = null;

// Transports data
const transportsData = new Map();
const transportOperationsData = new Map();
var lastTransportUpdate = null;
var lastTransportRecipesUpdate = null;

/*
 *  =======================================
 *               DATA GETTERS
 *  =======================================
 */

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

function getPrestigeBoard() {
  const now = Date.now();

  if (!lastBoardCache || now - lastBoardCache > cacheDuration) {
    prestigeBoardData.clear();
    const data = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../data/prestige_board_levels.json"),
        "utf8",
      ),
    );

    Object.keys(data).forEach((key) => {
      prestigeBoardData.set(key.toLowerCase(), data[key]);
    });

    lastBoardCache = now;
  }

  return prestigeBoardData;
}

function getSustenance() {
  const now = Date.now();

  if (!lastSustenanceCache || now - lastSustenanceCache > cacheDuration) {
    sustenanceData.clear();
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/sustenance.json"), "utf8"),
    );

    data.forEach((item) => {
      sustenanceData.set(item.category.toLowerCase(), item);
    });

    lastSustenanceCache = now;
  }

  return sustenanceData;
}

function getPaths() {
  const now = Date.now();
  if (!lastPathsCacheUpdate || now - lastPathsCacheUpdate > cacheDuration) {
    const paths = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/paths.json"), "utf-8"),
    );

    pathsCache.clear();
    paths
      .map((p) => [p.id, p])
      .forEach(([id, path]) => pathsCache.set(id, path));

    lastPathsCacheUpdate = now;
  }

  return pathsCache;
}

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

async function getMarketData(force = false) {
  try {
    const currentDate = new Date();

    if (
      force ||
      !lastMarketCache ||
      Math.abs(currentDate.getTime() - lastMarketCache.getTime()) >=
        marketCacheDuration
    ) {
      marketData.clear();

      // fetch from market data API
      const response = await fetch(MARKET_DATA_URL);
      const parsedData = await response.json();

      parsedData.forEach((market) => {
        marketData.set(market.name.toLowerCase(), market);
      });

      lastMarketCache = new Date();
      return marketData;
    }

    return marketData;
  } catch (error) {
    console.error("Error fetching market data:", error);
    throw new Error(`Error fetching market data: ${error.message}`);
  }
}

function getProducts() {
  var now = Date.now();

  if (!lastProductsCache || now - lastProductsCache > cacheDuration) {
    const products = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/products.json"), "utf8"),
    );

    productsCache.clear();
    products.forEach((product) => {
      productsCache.set(product.name.toLowerCase(), product);
    });
    lastProductsCache = now;
  }

  return productsCache;
}

async function getRecipes(force = false) {
  const currentDate = new Date();

  // Update cache if forced or if 2 hours have passed since the last update and the minute threshold has been reached
  if (
    force ||
    !lastRecipesUpdate ||
    (Math.abs(currentDate.getHours() - lastRecipesUpdate.getHours()) >= 2 &&
      currentDate.getMinutes() >= minuteUpdate)
  ) {
    console.log("Updating recipes cache...");

    try {
      // get recipes from api
      const newRecipes = await (
        await fetch(config.recipes_url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.MERC_API_TOKEN}`,
            "X-Merc-User": `${process.env.MERC_API_USER}`,
          },
        })
      ).json();

      // save recipes to local file
      fs.writeFileSync(
        path.join(__dirname, "../data/recipes.json"),
        JSON.stringify(newRecipes, null, 2),
      );

      // Clear old recipes and populate the cache with new ones
      recipesCache.clear();
      Object.entries(newRecipes).forEach(([key, value]) => {
        // Handle empty input/output arrays
        if (!Array.isArray(value.inputs)) {
          value.inputs = [];
        }

        if (!Array.isArray(value.outputs)) {
          value.outputs = [];
        }

        // Convert prestige and health properties to outputs array items if they exist
        if (value.prestige != undefined) {
          value.outputs.push({ product: "prestige", amount: value.prestige });
          delete value.prestige;
        }

        if (value.health != undefined) {
          value.outputs.push({ product: "health", amount: value.health });
          delete value.health;
        }

        recipesCache.set(key.toLowerCase(), value);
      });

      lastRecipesUpdate = currentDate;

      console.log("Recipes cache updated successfully.");

      return recipesCache;
    } catch (error) {
      console.error("Error updating recipes cache:", error);
      return recipesCache;
    }
  } else {
    return recipesCache;
  }
}

module.exports = {
  getPaths,

  getPrestigeBoard,
  getSustenance,

  getBuildings,
  getBuildingsDescriptions,
  getUpgrades,
  getUpgradesDescriptions,

  getMarketData,

  getProducts,

  getRecipes,

  getTransports,
  getTransportOperations,
};
