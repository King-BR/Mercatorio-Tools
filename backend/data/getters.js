const fs = require("fs");
const path = require("path");

const DEBUG = process.argv.includes("--debug");
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
const marketData = new Map();
const marketCacheDuration = 15 * 60 * 1000; // 15 minutes
var lastMarketCache = null;

// Products data
const productsCache = new Map();
var lastProductsCache = null;

// Pathfinding data
const pathsCache = new Map();
const ferriesCache = new Map();
var lastPathsCacheUpdate = null;
var lastFerriesCacheUpdate = null;

// Prestige data
const prestigeBoardData = new Map();
const sustenanceData = new Map();
var lastPrestigeDataUpdate = null;

// Recipes data
const recipesCache = new Map();
var lastRecipesUpdate = null;

// Transports data
const transportsData = new Map();
const transportOperationsData = new Map();
var lastTransportUpdate = null;
var lastTransportRecipesUpdate = null;

// Towns data
const townsData = new Map();
var lastTownsUpdate = null;
const townsCacheDuration = 30 * 60 * 1000; // 30 minutes

/*
 *  =======================================
 *               DATA GETTERS
 *  =======================================
 */

async function getTransports() {
  const now = Date.now();

  if (lastTransportUpdate && now - lastTransportUpdate < cacheDuration) {
    return transportsData;
  }

  transportsData.clear();

  await fetch(config.data_transports_url, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((transports) => {
      transports.forEach((transport) =>
        transportsData.set(transport.type, transport),
      );
    });

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

async function updatePrestigeData() {
  const now = Date.now();

  if (!lastPrestigeDataUpdate || now - lastPrestigeDataUpdate > cacheDuration) {
    prestigeBoardData.clear();
    sustenanceData.clear();

    const prestigeData = await fetch(config.data_prestige_url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MERC_API_TOKEN}`,
        "X-Merc-User": `${process.env.MERC_API_USER}`,
      },
    }).then((response) => response.json());

    Object.entries(prestigeData.prestige_bonuses).forEach(([key, item]) =>
      prestigeBoardData.set(key.toLowerCase(), item),
    );

    prestigeData.household_products.forEach((item) =>
      sustenanceData.set(item.category.toLowerCase(), item),
    );

    lastPrestigeDataUpdate = now;
    return;
  }

  return;
}

async function getPrestigeBoard() {
  const now = Date.now();

  if (!lastPrestigeDataUpdate || now - lastPrestigeDataUpdate > cacheDuration) {
    prestigeBoardData.clear();
    sustenanceData.clear();

    await updatePrestigeData();
  }

  return prestigeBoardData;
}

async function getSustenance() {
  const now = Date.now();

  if (!lastPrestigeDataUpdate || now - lastPrestigeDataUpdate > cacheDuration) {
    prestigeBoardData.clear();
    sustenanceData.clear();

    await updatePrestigeData();
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

function getFerries() {
  const now = Date.now();

  if (!lastFerriesCacheUpdate || now - lastFerriesCacheUpdate > cacheDuration) {
    const ferries = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/ferries.json"), "utf-8"),
    );

    ferriesCache.clear();
    ferries
      .map((f) => [f.id, f])
      .forEach(([id, ferry]) => ferriesCache.set(id, ferry));

    lastFerriesCacheUpdate = now;
  }

  return ferriesCache;
}

async function getBuildings() {
  const now = Date.now();

  if (lastBuildingsUpdate && now - lastBuildingsUpdate < cacheDuration) {
    return buildingsData;
  }

  // get buildings from api
  const newBuildings = await (
    await fetch(config.data_buildings_url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MERC_API_TOKEN}`,
        "X-Merc-User": `${process.env.MERC_API_USER}`,
      },
    })
  ).json();

  buildingsData.clear();
  Object.values(newBuildings).forEach((building) =>
    buildingsData.set(building.type, building),
  );

  fs.writeFileSync(
    path.join(__dirname, "./buildings.json"),
    JSON.stringify(Array.from(buildingsData.values()), null, 2),
    "utf8",
  );

  lastBuildingsUpdate = now;
  return buildingsData;
}

async function getBuildingTypes() {
  const buildings = await getBuildings();
  return Array.from(buildings.keys());
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

async function getUpgrades() {
  const now = Date.now();

  if (lastUpgradesUpdate && now - lastUpgradesUpdate < cacheDuration) {
    return upgradesData;
  }

  const buildings = Array.from((await getBuildings()).values());

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

async function getMarketData({
  force = false,
  maxAge = marketCacheDuration,
} = {}) {
  try {
    const currentDate = new Date();

    if (
      force ||
      !lastMarketCache ||
      Math.abs(currentDate.getTime() - lastMarketCache.getTime()) >= maxAge
    ) {
      marketData.clear();

      if (DEBUG) {
        const response = await fetch(
          "https://api.mercatorio-tools.tech/data/marketdata",
        );
        const markets = await response.json();

        markets.forEach((market) => {
          marketData.set(market.town.toLowerCase(), market);
        });

        return marketData;
      }

      const towns = await getTowns();

      for (const town of towns.values()) {
        await fetch(config.marketdata_url.replace("{townID}", town.id), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.MERC_API_TOKEN}`,
            "X-Merc-User": `${process.env.MERC_API_USER}`,
          },
        })
          .then((response) => {
            // console.log(response)
            return response.json();
          })
          .then((market) => {
            marketData.set(town.name.toLowerCase(), market);
          });
      }

      lastMarketCache = new Date();
      return marketData;
    }

    return marketData;
  } catch (error) {
    console.error("Error fetching market data:", error);
    throw new Error(`Error fetching market data: ${error.message}`);
  }
}

async function getProducts() {
  var now = Date.now();

  if (!lastProductsCache || now - lastProductsCache > cacheDuration) {
    // get products from api
    const newProducts = await (
      await fetch(config.data_products_url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MERC_API_TOKEN}`,
          "X-Merc-User": `${process.env.MERC_API_USER}`,
        },
      })
    ).json();

    productsCache.clear();
    newProducts.forEach((product) => {
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
        await fetch(config.data_recipes_url, {
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

async function getPlayer(req, auth = { user: null, apiKey: null }) {
  const response = await fetch(config.player_url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.apiKey}`,
      "X-Merc-User": `${auth.user}`,
    },
  });
  return await response.json();
}

async function getPlayerInventory(
  req,
  player,
  auth = { user: null, apiKey: null },
) {
  const businessResponse = await fetch(
    config.business_url.replace(
      "{businessID}",
      player.household.business_ids[0],
    ),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.apiKey}`,
        "X-Merc-User": `${auth.user}`,
      },
    },
  );

  const businessData = await businessResponse.json();
  const inventoryID = businessData.buildings.find(
    (building) =>
      building.type === "storehouse" || building.type === "warehouse",
  )?.id;

  const inventoryResponse = await fetch(
    config.building_url.replace("{buildingID}", inventoryID),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.apiKey}`,
        "X-Merc-User": `${auth.user}`,
      },
    },
  );

  return await inventoryResponse.json();
}

async function getBuilding(
  req,
  buildingID,
  auth = { user: null, apiKey: null },
) {
  const response = await fetch(
    config.building_url.replace("{buildingID}", buildingID),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.apiKey}`,
        "X-Merc-User": `${auth.user}`,
      },
    },
  );
  return await response.json();
}

async function getTowns() {
  const currentDate = new Date();
  if (!lastTownsUpdate || currentDate - lastTownsUpdate > townsCacheDuration) {
    try {
      const response = await fetch(config.towns_url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MERC_API_TOKEN}`,
          "X-Merc-User": `${process.env.MERC_API_USER}`,
        },
      });
      const towns = await response.json();

      // save towns to local file
      fs.writeFileSync(
        path.join(__dirname, "../data/towns.json"),
        JSON.stringify(towns, null, 2),
      );

      towns.forEach((town) => {
        townsData.set(town.id, town);
      });
      lastTownsUpdate = currentDate;
      console.log("Towns cache updated successfully.");
      return townsData;
    } catch (error) {
      console.error("Error updating towns cache:", error);
      return townsData;
    }
  } else {
    return townsData;
  }
}

function getTownByID(townID) {
  return townsData.get(townID);
}

function getTownByName(townName) {
  for (const town of townsData.values()) {
    if (town.name.toLowerCase() === townName.toLowerCase()) {
      return town;
    }
  }
  return null;
}

module.exports = {
  getPaths,
  getFerries,

  getPlayer,
  getPlayerInventory,

  getBuilding,

  getPrestigeBoard,
  getSustenance,

  getBuildings,
  getBuildingTypes,
  getBuildingsDescriptions,
  getUpgrades,
  getUpgradesDescriptions,

  getMarketData,

  getTowns,
  getTownByID,
  getTownByName,

  getProducts,

  getRecipes,

  getTransports,
  getTransportOperations,
};
