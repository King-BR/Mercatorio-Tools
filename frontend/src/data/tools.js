var categoriesArray = [
  {
    id: "all",
    name: "All",
  },
  {
    id: "info",
    name: "Information",
  },
  {
    id: "map",
    name: "Maps",
  },
  {
    id: "production",
    name: "Production",
  },
  {
    id: "economy",
    name: "Economy",
  },
  {
    id: "utility",
    name: "Utilities",
  },
  {
    id: "automation",
    name: "Automation",
  },
];

var toolsCache = null;
var cacheDuration = 60 * 60 * 1000; // Cache duration in milliseconds (1 hour)
var lastCacheTime = null;

async function getTools() {
  await updateCache();

  return toolsCache;
}

async function updateCache() {
  if (Date.now() - lastCacheTime < cacheDuration) return;

  lastCacheTime = Date.now();

  try {
    const response = await fetch("api/tools");
    toolsCache = await response.json();
  } catch (error) {
    console.error(`Error fetching tools data:\n${error}`);
  }
}

export var tools = await getTools();
export var categories = categoriesArray;
