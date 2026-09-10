const MERCATORIO_CONFIG_KEYS = {
  products: "ZE",
  transport: "TY",
  transport_operations: "lF",
  buildings: "qX",
  recipes: "_e",
};

const MERCATORIO_PRESTIGE_KEYS = {
  prestige_board: "m",
  sustenance: "t",
};

const TYPE_LABELS = {
  game_config: "Game config",

  products: "Products",
  transport: "Transport data",
  transport_operations: "Transport operations",
  buildings: "Buildings",
  recipes: "Recipes",

  prestige: "Prestige data",
  prestige_board: "Prestige board",
  sustenance: "Sustenance",

  product_descriptions: "Product descriptions",
  recipe_descriptions: "Recipe descriptions",
  building_descriptions: "Building descriptions",
  upgrade_descriptions: "Upgrade descriptions",

  unknown: "Unknown",
};

const RECIPE_KEYS = new Set([
  "recipe",
  "recipes",
  "input",
  "inputs",
  "ingredient",
  "ingredients",
  "output",
  "outputs",
  "duration",
  "quantity",
  "amount",
]);

const BUILDING_KEYS = new Set([
  "building",
  "buildings",
  "buildingid",
  "construction",
  "constructioncost",
  "upgrade",
  "upgrades",
  "workers",
  "workforce",
  "production",
  "maintenance",
  "level",
]);

const PRODUCT_KEYS = new Set([
  "product",
  "products",
  "productid",
  "item",
  "itemid",
  "name",
  "description",
  "category",
  "tier",
  "price",
]);

const WORKER_KEYS = new Set([
  "worker",
  "workers",
  "workforce",
  "labour",
  "labor",
  "profession",
  "professions",
  "skill",
  "skills",
]);

function isObject(value) {
  return value !== null && typeof value === "object";
}

function isPlainObject(value) {
  return isObject(value) && !Array.isArray(value);
}

function normalizeKey(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeName(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function getValueStats(value) {
  const stats = {
    objects: 0,
    arrays: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,

    totalValues: 0,

    keyCount: 0,

    shortStrings: 0,
    mediumStrings: 0,
    longStrings: 0,

    maxDepth: 0,
  };

  function visit(current, depth) {
    stats.maxDepth = Math.max(stats.maxDepth, depth);

    if (current === null) {
      stats.nulls++;
      stats.totalValues++;
      return;
    }

    if (Array.isArray(current)) {
      stats.arrays++;

      for (const item of current) {
        visit(item, depth + 1);
      }

      return;
    }

    switch (typeof current) {
      case "object":
        stats.objects++;

        for (const [key, child] of Object.entries(current)) {
          stats.keyCount++;
          visit(child, depth + 1);
        }

        break;

      case "string":
        stats.strings++;
        stats.totalValues++;

        if (current.length < 30) {
          stats.shortStrings++;
        } else if (current.length < 150) {
          stats.mediumStrings++;
        } else {
          stats.longStrings++;
        }

        break;

      case "number":
        stats.numbers++;
        stats.totalValues++;
        break;

      case "boolean":
        stats.booleans++;
        stats.totalValues++;
        break;

      default:
        stats.totalValues++;
        break;
    }
  }

  visit(value, 0);

  return stats;
}

function collectKeys(value, result = [], depth = 0) {
  if (!isObject(value) || depth > 10) {
    return result;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectKeys(item, result, depth + 1);
    }

    return result;
  }

  for (const [key, child] of Object.entries(value)) {
    result.push(key);

    if (isObject(child)) {
      collectKeys(child, result, depth + 1);
    }
  }

  return result;
}

function countKeys(value, candidates) {
  const keys = collectKeys(value);

  let count = 0;

  for (const key of keys) {
    if (candidates.has(normalizeKey(key))) {
      count++;
    }
  }

  return count;
}

/**
 * Detects the actual Mercatorio game configuration.
 *
 * Known structure:
 *
 * {
 *   ZE: products,
 *   TY: transport,
 *   lF: transport operations,
 *   qX: buildings,
 *   _e: recipes,
 *   FI: {
 *     m: prestige board,
 *     t: sustenance
 *   }
 * }
 */
function detectGameConfig(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const found = [];

  for (const [type, key] of Object.entries(MERCATORIO_CONFIG_KEYS)) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      found.push({
        type,
        key,
      });
    }
  }

  let prestige = null;

  if (isPlainObject(value.FI)) {
    prestige = [];

    for (const [type, key] of Object.entries(MERCATORIO_PRESTIGE_KEYS)) {
      if (Object.prototype.hasOwnProperty.call(value.FI, key)) {
        prestige.push({
          type,
          key,
        });
      }
    }
  }

  const knownKeyCount = found.length + (prestige?.length || 0);

  if (knownKeyCount === 0) {
    return null;
  }

  let confidence = 0.7;

  if (found.length >= 2) {
    confidence += 0.1;
  }

  if (found.length >= 4) {
    confidence += 0.1;
  }

  if (found.length >= 5) {
    confidence += 0.05;
  }

  if (prestige && prestige.length > 0) {
    confidence += 0.05;
  }

  return {
    type: "game_config",
    label: TYPE_LABELS.game_config,
    confidence: Math.min(confidence, 1),
    reason: "Recognized Mercatorio game configuration structure.",
    knownKeys: found,
    prestigeKeys: prestige || [],
  };
}

/**
 * Extract known datasets from the game config.
 */
function extractGameConfigDatasets(value) {
  const result = [];

  if (!isPlainObject(value)) {
    return result;
  }

  for (const [type, key] of Object.entries(MERCATORIO_CONFIG_KEYS)) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      result.push({
        path: key,
        type,
        label: TYPE_LABELS[type],
        confidence: 1,
        reason: `Mercatorio game config key '${key}'.`,
        data: value[key],
      });
    }
  }

  if (isPlainObject(value.FI)) {
    result.push({
      path: "FI",
      type: "prestige",
      label: TYPE_LABELS.prestige,
      confidence: 1,
      reason: "Mercatorio game config prestige container 'FI'.",
      data: value.FI,
    });

    for (const [type, key] of Object.entries(MERCATORIO_PRESTIGE_KEYS)) {
      if (Object.prototype.hasOwnProperty.call(value.FI, key)) {
        result.push({
          path: `FI.${key}`,
          type,
          label: TYPE_LABELS[type],
          confidence: 1,
          reason: `Mercatorio prestige config key 'FI.${key}'.`,
          data: value.FI[key],
        });
      }
    }
  }

  return result;
}

/**
 * Extract possible names/IDs from a dataset.
 *
 * This is intentionally recursive because we don't know the
 * exact structure of ZE/qX/_e yet.
 */
function collectIdentifiers(value, result = new Set(), depth = 0) {
  if (!isObject(value) || depth > 10) {
    return result;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectIdentifiers(item, result, depth + 1);
    }

    return result;
  }

  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = normalizeKey(key);

    if (
      normalizedKey === "id" ||
      normalizedKey === "key" ||
      normalizedKey === "name" ||
      normalizedKey === "slug" ||
      normalizedKey === "productid" ||
      normalizedKey === "buildingid" ||
      normalizedKey === "recipeid" ||
      normalizedKey === "itemid"
    ) {
      if (typeof child === "string" && child.length > 0) {
        result.add(normalizeName(child));
      }
    }

    /*
     * Sometimes the object itself is keyed by the entity name:
     *
     * {
     *   "alloy bronze": {...}
     * }
     */
    if (isObject(child) && typeof key === "string") {
      result.add(normalizeName(key));
    }

    if (isObject(child)) {
      collectIdentifiers(child, result, depth + 1);
    }
  }

  return result;
}

function analyzeStringDictionary(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const entries = Object.entries(value);

  if (entries.length < 3) {
    return null;
  }

  const stringEntries = entries.filter(
    ([, child]) => typeof child === "string",
  );

  const stringRatio = stringEntries.length / entries.length;

  if (stringRatio < 0.8) {
    return null;
  }

  const averageStringLength =
    stringEntries.length > 0
      ? stringEntries.reduce((sum, [, text]) => sum + text.length, 0) /
        stringEntries.length
      : 0;

  return {
    count: entries.length,
    stringCount: stringEntries.length,
    stringRatio,
    averageStringLength,
  };
}

/**
 * Identify description dictionaries.
 *
 * Examples:
 *
 * product descriptions:
 * {
 *   "acid": "...",
 *   "alembics": "...",
 *   "arms": "..."
 * }
 *
 * upgrade descriptions:
 * {
 *   "armsrack": "...",
 *   "bellows": "...",
 *   "guard booth": "..."
 * }
 */
function classifyDescriptionDictionary(value, context = {}) {
  const analysis = analyzeStringDictionary(value);

  if (!analysis) {
    return null;
  }

  const keys = Object.keys(value).map(normalizeName);

  const productIds = context.productIds || new Set();

  const buildingIds = context.buildingIds || new Set();

  const recipeIds = context.recipeIds || new Set();

  let productMatches = 0;
  let buildingMatches = 0;
  let recipeMatches = 0;

  for (const key of keys) {
    if (productIds.has(key)) {
      productMatches++;
    }

    if (buildingIds.has(key)) {
      buildingMatches++;
    }

    if (recipeIds.has(key)) {
      recipeMatches++;
    }
  }

  const totalKeys = keys.length;

  const productRatio = productMatches / totalKeys;

  const buildingRatio = buildingMatches / totalKeys;

  const recipeRatio = recipeMatches / totalKeys;

  /*
   * Recipe descriptions have the special structure:
   *
   * {
   *   "alloy bronze": {
   *     "text": "...",
   *     "inputs": {...}
   *   }
   * }
   */
  const firstValues = Object.values(value);

  const recipeDescriptionObjects = firstValues.filter(
    (item) =>
      isPlainObject(item) &&
      typeof item.text === "string" &&
      isPlainObject(item.inputs),
  );

  if (recipeDescriptionObjects.length >= Math.max(1, totalKeys * 0.5)) {
    let confidence = 0.95;

    if (recipeRatio > 0.5) {
      confidence += 0.04;
    }

    return {
      type: "recipe_descriptions",
      label: TYPE_LABELS.recipe_descriptions,
      confidence: Math.min(confidence, 0.99),
      reason:
        "Dictionary entries contain 'text' and 'inputs', matching Mercatorio recipe descriptions.",
      stats: {
        entries: totalKeys,
        recipeNameMatches: recipeMatches,
        recipeNameRatio: recipeRatio,
      },
    };
  }

  /*
   * Building descriptions:
   *
   * {
   *   "alloy smelter": {
   *     "text": "...",
   *     "upgrades": {...}
   *   }
   * }
   */
  const buildingDescriptionObjects = firstValues.filter(
    (item) =>
      isPlainObject(item) &&
      typeof item.text === "string" &&
      isPlainObject(item.upgrades),
  );

  if (buildingDescriptionObjects.length >= Math.max(1, totalKeys * 0.5)) {
    let confidence = 0.95;

    if (buildingRatio > 0.5) {
      confidence += 0.04;
    }

    return {
      type: "building_descriptions",
      label: TYPE_LABELS.building_descriptions,
      confidence: Math.min(confidence, 0.99),
      reason:
        "Dictionary entries contain 'text' and 'upgrades', matching Mercatorio building descriptions.",
      stats: {
        entries: totalKeys,
        buildingNameMatches: buildingMatches,
        buildingNameRatio: buildingRatio,
      },
    };
  }

  /*
   * Product descriptions.
   */
  if (productRatio >= 0.5) {
    return {
      type: "product_descriptions",
      label: TYPE_LABELS.product_descriptions,
      confidence: Math.min(0.9 + productRatio * 0.09, 0.99),
      reason:
        "Dictionary keys match product identifiers from the Mercatorio product dataset.",
      stats: {
        entries: totalKeys,
        productNameMatches: productMatches,
        productNameRatio: productRatio,
        averageStringLength: Math.round(analysis.averageStringLength),
      },
    };
  }

  /*
   * If there are building matches but no product matches,
   * it is probably an upgrade dictionary.
   *
   * Upgrade descriptions use simple:
   *
   * {
   *   "armsrack": "...",
   *   "bellows": "...",
   *   "guard booth": "..."
   * }
   */
  if (buildingRatio >= 0.2) {
    return {
      type: "upgrade_descriptions",
      label: TYPE_LABELS.upgrade_descriptions,
      confidence: Math.min(0.75 + buildingRatio * 0.2, 0.95),
      reason:
        "Dictionary contains descriptive strings associated with building upgrade data.",
      stats: {
        entries: totalKeys,
        buildingNameMatches: buildingMatches,
        buildingNameRatio: buildingRatio,
      },
    };
  }

  /*
   * Generic fallback for the known style of product
   * descriptions.
   */
  if (analysis.averageStringLength >= 30 && analysis.stringRatio >= 0.9) {
    return {
      type: "product_descriptions",
      label: TYPE_LABELS.product_descriptions,
      confidence: 0.65,
      reason:
        "Large dictionary of descriptive strings matching the structure of Mercatorio product descriptions.",
      stats: {
        entries: totalKeys,
        averageStringLength: Math.round(analysis.averageStringLength),
      },
    };
  }

  return null;
}

function classifyGenericDataset(value, context = {}) {
  const stats = getValueStats(value);

  const recipeMatches = countKeys(value, RECIPE_KEYS);

  const buildingMatches = countKeys(value, BUILDING_KEYS);

  const productMatches = countKeys(value, PRODUCT_KEYS);

  const workerMatches = countKeys(value, WORKER_KEYS);

  const scores = {
    recipes: 0,
    buildings: 0,
    products: 0,
    workers: 0,
  };

  scores.recipes += Math.min(recipeMatches * 2, 10);

  scores.buildings += Math.min(buildingMatches * 2, 10);

  scores.products += Math.min(productMatches * 2, 10);

  scores.workers += Math.min(workerMatches * 2, 10);

  if (Array.isArray(value)) {
    scores.recipes += 1;
    scores.products += 1;
  }

  if (stats.arrays > 0) {
    scores.recipes += 1;
  }

  const candidates = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (candidates.length === 0 || candidates[0][1] < 5) {
    return {
      type: "unknown",
      label: TYPE_LABELS.unknown,
      confidence: 0.1,
      reason: "No known Mercatorio structure was detected.",
      stats,
      scores,
    };
  }

  const [bestType, bestScore] = candidates[0];

  const secondScore = candidates[1]?.[1] || 0;

  let confidence = 0.5;

  if (bestScore >= secondScore + 5) {
    confidence += 0.2;
  }

  if (bestScore >= 10) {
    confidence += 0.15;
  }

  return {
    type: bestType,
    label: TYPE_LABELS[bestType] || TYPE_LABELS.unknown,
    confidence: Math.min(confidence, 0.95),
    reason: "Classification based on dataset structure.",
    stats,
    scores,
  };
}

/**
 * Main classifier.
 */
function classifyDataset(value, context = {}) {
  const gameConfig = detectGameConfig(value);

  if (gameConfig) {
    return {
      ...gameConfig,
      stats: getValueStats(value),
    };
  }

  const description = classifyDescriptionDictionary(value, context);

  if (description) {
    return {
      ...description,
      stats: getValueStats(value),
    };
  }

  return classifyGenericDataset(value, context);
}

module.exports = {
  TYPE_LABELS,
  MERCATORIO_CONFIG_KEYS,
  MERCATORIO_PRESTIGE_KEYS,

  classifyDataset,
  detectGameConfig,
  extractGameConfigDatasets,

  collectIdentifiers,
  getValueStats,

  normalizeKey,
  normalizeName,
};
