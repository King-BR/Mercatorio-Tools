const categoriestmp = [
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

const toolstmp = [
  {
    id: "interactive-map",
    name: "Interactive Map",
    description:
      "Explore the world of Mercatorio, find towns, resources, and use navigation tools.",
    category: "map",
    icon: "🗺️",
    url: "https://king-br.github.io/Mercatorio-Interactive-Map/",
    status: "available",
    functional: true,
    featured: true,
    external: true,
    creator: ".kingbr (Leon Q. de Berkelegh)",
    tags: ["automation", "map", "navigation", "trade routes"],
  },
  {
    id: "statistics",
    name: "Statistics",
    description:
      "View various statistics and data visualizations related to the game.",
    category: "utility",
    icon: "📊",
    url: "https://stats.mercatorio-tools.tech",
    status: "available",
    functional: true,
    featured: true,
    external: true,
    creator: "tad0390 (Thosas Fynien)",
    manteiner: ".kingbr (Leon Q. de Berkelegh)",
    tags: ["statistics", "data", "visualization"],
  },
  {
    id: "mercatorio_planner",
    name: "Mercatorio Planner",
    description:
      "Plan which town and specialization to choose with other players to avoid competitive clashes.",
    category: "map",
    icon: "🏘️",
    url: "https://mercatorio-planner.mercatorio-planner.workers.dev/",
    status: "available",
    functional: true,
    featured: true,
    external: true,
    creator: "Jerry Wylteshire",
    tags: ["towns", "planning"],
  },
  {
    id: "notifications",
    name: "Custom Notifications",
    description:
      "Create custom notifications based on events, prices, and game data with a easy to use interface.",
    category: "utility",
    icon: "🔔",
    url: "/notifications",
    status: "dev",
    functional: false,
    featured: false,
    external: false,
    creator: ".kingbr (Leon Q. de Berkelegh)",
    tags: ["notifications", "alerts", "discord"],
  },
  {
    id: "wiki",
    name: "Wiki",
    description:
      "Access the Mercatorio wiki for detailed information about the game.",
    category: "info",
    icon: "📚",
    url: "https://wiki.mercatorio-tools.tech",
    status: "dev",
    functional: true,
    featured: false,
    external: true,
    creator: ".kingbr (Leon Q. de Berkelegh)",
    tags: ["external", "wiki", "information"],
  },
  {
    id: "production-planner",
    name: "Production Planner",
    description:
      "Plan production lines and visualize the chains needed to manufacture your products.",
    category: "production",
    icon: "🏭",
    url: "/production",
    status: "planned",
    functional: false,
    featured: false,
    external: false,
    creator: ".kingbr (Leon Q. de Berkelegh)",
    tags: ["production", "recipes", "planning"],
  },
];

var toolsCache = null;
var categoriesCache = null;
var cacheDuration = 60 * 60 * 1000; // Cache duration in milliseconds (1 hour)
var lastCacheTime = null;

function getTools() {
  updateCache();

  return toolstmp;
}

function getCategories() {
  updateCache();

  return categoriestmp;
}

function updateCache() {
  if (Date.now() - lastCacheTime < cacheDuration) return;

  lastCacheTime = Date.now();
}

export var tools = getTools();
export var categories = getCategories();
