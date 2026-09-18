import logger from "../../utils/logger";

/**
 * @typedef {Map<string, number>} MaterialList
 */

/**
 * @typedef {Object} PerRecipeMaterials
 * @property {number} count Total count of buildings using this recipe (including expansions).
 * @property {number} buildingCount Number of independent buildings.
 * @property {number} expansionCount Total number of expansions.
 * @property {Map<string, MaterialList>} upgrades All upgrades required for this recipe, including the prerequisites of directly required upgrades.
 * @property {MaterialList} materials Materials for the building, expansions, and upgrades.
 * @property {number} time Time for buildings and expansions.
 * @property {number} upgradeTime Total time for upgrades.
 * @property {number} totalTime Total time for the construction.
 * @property {number} manaPoints Management points required for the construction.
 */

/**
 * @typedef {Object} BuildingMaterialsList
 * @property {number} count Total count of units of the building.
 * @property {Map<string, PerRecipeMaterials>} perRecipe Materials and times separated by recipe.
 * @property {MaterialList} totalMaterials Total materials for the building.
 * @property {string[]} requiredHosts Hosts required for the building.
 * @property {number} totalTime Total time for the building.
 * @property {number} manaPoints Management points required for the building.
 */

/**
 * Calculate the materials and time required for the buildings.
 *
 * Rules:
 *
 * - recipeData.count = total number of units of the building,
 *   including expansions.
 *
 * - construction.size = maximum size of an independent building.
 *
 * - Each independent building has a base construction.
 *
 * - Additional units of the same building are expansions.
 *
 * - Expansions use construction.discount.
 *
 * - If count > size, multiple independent buildings are required.
 *
 * - Each independent building needs to build its own chain of upgrades.
 *
 * - recipeData.upgrades is a Set containing ONLY the upgrades directly required by the recipe.
 *
 * - upgradesChain contains the prerequisites of these upgrades.
 *
 * @param {Map<string, Object>} buildings
 * @param {Map<string, Object>|Object} buildingsData
 * @param {Map<string, Map<string, string|null>>} upgradesChain
 *
 * @returns {Map<string, BuildingMaterialsList>}
 */
export function calculateBuildingMaterials(
  buildings,
  buildingsData,
  upgradesChain,
) {
  const materialsByBuilding = new Map();

  for (const [buildingName, buildingData] of buildings) {
    const buildingRecipes = buildingData?.perRecipe;

    if (!buildingRecipes) {
      continue;
    }

    const buildingInfo = getBuildingData(buildingsData, buildingName);

    if (!buildingInfo) {
      continue;
    }

    const construction = buildingInfo.construction;

    if (!construction) {
      continue;
    }

    const perRecipe = new Map();
    const totalMaterials = new Map();
    var totalManaPoints = 0;

    let totalCount = 0;
    let totalTime = 0;

    const isAttachment =
      buildingInfo.requires?.hosts && buildingInfo.requires?.hosts?.length > 0;

    const requiredHosts = buildingInfo.requires?.hosts ?? [];

    // get max size of hosts
    const hostMaxSize = isAttachment
      ? Math.max(
          ...requiredHosts.map((hostName) =>
            Number(
              getBuildingData(buildingsData, hostName)?.construction?.size ?? 1,
            ),
          ),
        )
      : 0;

    for (const [recipeName, recipeData] of buildingRecipes) {
      const count = Number(recipeData?.count ?? 0);

      if (count <= 0) {
        continue;
      }

      totalCount += count;

      /*
       * ---------------------------------------------------------------
       * BUILDING SIZE
       * ---------------------------------------------------------------
       */
      const maxSize = isAttachment
        ? hostMaxSize
        : Math.max(1, Number(construction.size ?? 1));

      /*
       * Number of independent buildings.
       *
       * Example:
       *
       * size = 3
       * count = 7
       *
       * => 3 independent buildings:
       *
       * 3 + 3 + 1
       */
      const buildingCount = Math.ceil(count / maxSize);

      /*
       * Number of expansions.
       *
       * Each independent building already has its first unit
       * built as the base construction.
       *
       * Therefore:
       *
       * expansions = count - buildingCount
       */
      const expansionCount = isAttachment
        ? 0
        : Math.max(0, count - buildingCount);

      /*
       * ---------------------------------------------------------------
       * BASE + EXPANSIONS MATERIALS
       * ---------------------------------------------------------------
       */

      const materials = new Map();

      const baseMaterials = construction.materials ?? {};

      /*
       * A base construction for each independent building.
       */
      for (const [product, amount] of getMaterialEntries(baseMaterials)) {
        addMaterial(materials, product, Number(amount) * buildingCount);
      }

      /*
       * ---------------------------------------------------------------
       * EXPANSIONS
       * ---------------------------------------------------------------
       */

      const discount = Number(construction.discount ?? 0);

      const discountMultiplier = Math.max(0, 1 - discount / 100);

      for (const [product, amount] of getMaterialEntries(baseMaterials)) {
        addMaterial(
          materials,
          product,
          Number(amount) * discountMultiplier * expansionCount,
        );
      }

      /*
       * ---------------------------------------------------------------
       * CONSTRUCTION TIME
       * ---------------------------------------------------------------
       *
       * Each unit, whether base construction or expansion,
       * consumes construction.time.
       */
      const constructionTime = Number(construction.time ?? 0) * count;

      /*
       * ---------------------------------------------------------------
       * UPGRADES
       * ---------------------------------------------------------------
       */

      const upgrades = new Map();

      let upgradeTime = 0;

      /*
       * recipeData.upgrades is a SET containing only the upgrades
       * directly required by the recipe.
       *
       * Exemplo:
       *
       * Set {
       *   "toolshed 2"
       * }
       */
      const directUpgrades = getSetValues(recipeData?.upgrades);
      const manaPointsByUpgrades = new Map();

      if (directUpgrades.length > 0 && upgradesChain?.has(buildingName)) {
        /*
         * Expands the directly required upgrades to include
         * all prerequisites.
         *
         * Exemplo:
         *
         * direct:
         *
         *   toolshed 2
         *
         * chain:
         *
         *   toolshed 1 -> null
         *   toolshed 2 -> toolshed 1
         *
         * result:
         *
         *   toolshed 1
         *   toolshed 2
         */
        const requiredUpgrades = getUpgradeChain(
          buildingName,
          upgradesChain,
          directUpgrades,
        );

        for (const upgradeType of requiredUpgrades) {
          const upgradeData = findUpgrade(buildingInfo, upgradeType);

          if (!upgradeData) {
            continue;
          }

          manaPointsByUpgrades.set(upgradeType, upgradeData.management);

          const upgradeConstruction = upgradeData.construction;

          if (!upgradeConstruction) {
            continue;
          }

          /*
           * -----------------------------------------------------------
           * UPGRADE MATERIALS
           * -----------------------------------------------------------
           *
           * Each independent building needs to build the upgrade.
           */
          const upgradeMaterials = upgradeConstruction.materials ?? {};

          const upgradeMaterialList = new Map();

          for (const [product, amount] of getMaterialEntries(
            upgradeMaterials,
          )) {
            const totalAmount = Number(amount) * buildingCount;

            /*
             * Materials specific to this upgrade.
             */
            addMaterial(upgradeMaterialList, product, totalAmount);

            /*
             * Total materials for the recipe.
             */
            addMaterial(materials, product, totalAmount);
          }

          /*
           * Stores the complete upgrade in perRecipe.upgrades.
           */
          upgrades.set(upgradeType, upgradeMaterialList);

          /*
           * Each independent building constructs this upgrade once.
           *
           * Upgrades have size = 1.
           */
          upgradeTime += Number(upgradeConstruction.time ?? 0) * buildingCount;
        }
      }

      /*
       * ---------------------------------------------------------------
       * TOTAL TIME
       * ---------------------------------------------------------------
       */

      const recipeTotalTime = constructionTime + upgradeTime;

      totalTime += recipeTotalTime;

      /*
       * ---------------------------------------------------------------
       * MANAGEMENT POINTS COST
       * ---------------------------------------------------------------
       */

      var manaPoints = buildingInfo.requires?.hosts
        ? 0.5
        : 1 +
          (buildingCount - 1) * 0.5 +
          expansionCount *
            (construction.size <= 10
              ? 0.25
              : construction.size > 10 && construction.size < 75
                ? 0.1
                : 0.01);

      for (const [upgradeType, upgradeManaPoints] of manaPointsByUpgrades) {
        manaPoints += upgradeManaPoints * count;
      }

      totalManaPoints += manaPoints;

      /*
       * ---------------------------------------------------------------
       * PER RECIPE
       * ---------------------------------------------------------------
       */

      perRecipe.set(recipeName, {
        count,
        buildingCount,
        expansionCount,
        upgrades,
        materials,
        time: constructionTime,
        upgradeTime,
        totalTime: recipeTotalTime,
        manaPoints,
      });

      /*
       * ---------------------------------------------------------------
       * TOTAL BUILDING MATERIALS
       * ---------------------------------------------------------------
       */

      for (const [product, amount] of materials) {
        addMaterial(totalMaterials, product, amount);
      }
    }

    /*
     * ---------------------------------------------------------------
     * BUILDING RESULT
     * ---------------------------------------------------------------
     */

    materialsByBuilding.set(buildingName, {
      count: totalCount,
      perRecipe,
      totalMaterials,
      totalTime,
      requiredHosts,
      manaPoints: totalManaPoints,
    });
  }

  logger.log("Materials By Building:", materialsByBuilding);
  return materialsByBuilding;
}

/* ==========================================================================
 * HELPERS
 * ========================================================================== */

/**
 * Gets the data of a building.
 *
 * @param {Map<string, Object>|Object} buildingsData
 * @param {string} buildingName
 * @returns {Object|null}
 */
function getBuildingData(buildingsData, buildingName) {
  if (!buildingsData) {
    return null;
  }

  if (buildingsData instanceof Map) {
    return buildingsData.get(buildingName) ?? null;
  }

  return buildingsData[buildingName] ?? null;
}

/**
 * Adds material to the Map.
 *
 * @param {Map<string, number>} materials
 * @param {string} product
 * @param {number} amount
 */
function addMaterial(materials, product, amount) {
  if (!product) {
    return;
  }

  if (!Number.isFinite(amount)) {
    return;
  }

  if (amount === 0) {
    return;
  }

  materials.set(product, (materials.get(product) ?? 0) + amount);
}

/**
 * Gets entries of materials.
 *
 * Accepts Map or Object.
 *
 * @param {Map<string, number>|Object} materials
 * @returns {Array<[string, number]>}
 */
function getMaterialEntries(materials) {
  if (!materials) {
    return [];
  }

  if (materials instanceof Map) {
    return Array.from(materials.entries());
  }

  if (typeof materials === "object" && !Array.isArray(materials)) {
    return Object.entries(materials);
  }

  return [];
}

/**
 * Gets values from a Set.
 *
 * @param {Set<string>|Array<string>|null} values
 * @returns {string[]}
 */
function getSetValues(values) {
  if (!values) {
    return [];
  }

  if (values instanceof Set) {
    return Array.from(values.values());
  }

  if (Array.isArray(values)) {
    return values;
  }

  return [];
}

/**
 * Searches for an upgrade by its type.
 *
 * @param {Object} buildingData
 * @param {string} upgradeType
 * @returns {Object|null}
 */
function findUpgrade(buildingData, upgradeType) {
  const upgrades = buildingData?.upgrades;

  if (!Array.isArray(upgrades)) {
    return null;
  }

  return upgrades.find((upgrade) => upgrade?.type === upgradeType) ?? null;
}

/**
 * Gets the full chain of required upgrades for a building.
 *
 * `needs` contains only the upgrades directly required
 * by the recipe.
 *
 * Prerequisites are found through upgradesByBuilding.
 *
 * Example:
 *
 * upgradesByBuilding (example):
 *
 * Map {
 *   "toolshed 1" => null,
 *   "toolshed 2" => "toolshed 1"
 * }
 *
 * needs (example):
 *
 * [
 *   "toolshed 2"
 * ]
 *
 * result:
 *
 * [
 *   "toolshed 1",
 *   "toolshed 2"
 * ]
 *
 * @param {string} buildingType
 * @param {Map<string, Map<string, string|null>>} upgradesByBuilding
 * @param {string[]|string} needs
 * @returns {string[]}
 */
export function getUpgradeChain(buildingType, upgradesByBuilding, needs) {
  const upgrades = upgradesByBuilding.get(buildingType);

  if (!upgrades) {
    return [];
  }

  const requiredUpgrades = Array.isArray(needs) ? needs : [needs];

  const chain = [];
  const added = new Set();
  const visiting = new Set();

  function addUpgrade(upgrade) {
    if (!upgrade) {
      return;
    }

    if (added.has(upgrade)) {
      return;
    }

    /*
     * Detects circular upgrade dependencies.
     */
    if (visiting.has(upgrade)) {
      throw new Error(`Circular upgrade dependency detected: ${upgrade}`);
    }

    /*
     * The upgrade must exist in the map.
     */
    if (!upgrades.has(upgrade)) {
      throw new Error(
        `Upgrade "${upgrade}" was not found for building "${buildingType}".`,
      );
    }

    visiting.add(upgrade);

    /*
     * Gets the prerequisite.
     *
     * null = has no prerequisite.
     */
    const requirement = upgrades.get(upgrade);

    if (requirement) {
      addUpgrade(requirement);
    }

    visiting.delete(upgrade);

    /*
     * Prerequisite is added before the upgrade.
     */
    added.add(upgrade);
    chain.push(upgrade);
  }

  /*
   * Starts ONLY with the upgrades directly required
   * by the recipe.
   */
  for (const upgrade of requiredUpgrades) {
    addUpgrade(upgrade);
  }

  return chain;
}

/**
 * Gets the total materials required for all buildings.
 * @param {Map<string, BuildingMaterialsList>} materialsByBuilding
 * @returns {MaterialList}
 */
export function getTotalMaterials(materialsByBuilding) {
  const totalMaterials = new Map();

  if (!materialsByBuilding || !materialsByBuilding.size) {
    return totalMaterials;
  }

  for (const buildingMaterialList of materialsByBuilding.values()) {
    for (const [
      material,
      amount,
    ] of buildingMaterialList.totalMaterials.entries()) {
      totalMaterials.set(
        material,
        (totalMaterials.get(material) || 0) + amount,
      );
    }
  }

  return totalMaterials;
}

/**
 * Gets materials grouped by recipe.
 * @param {Map<string, BuildingMaterialsList>} materialsByBuilding
 * @returns {Map<string, {buildingType: string, upgrades: string[], materials:MaterialList}>}
 */
export function getMaterialsByRecipe(materialsByBuilding) {
  const materialsByRecipe = new Map();

  if (!materialsByBuilding || !materialsByBuilding.size) {
    return materialsByRecipe;
  }

  for (const [
    building,
    buildingMaterialList,
  ] of materialsByBuilding.entries()) {
    for (const [
      recipe,
      recipeMaterialList,
    ] of buildingMaterialList.perRecipe.entries()) {
      materialsByRecipe.set(recipe, {
        buildingType: building,
        upgrades: Array.from(recipeMaterialList.upgrades.keys()),
        materials: recipeMaterialList.materials,
      });
    }
  }

  return materialsByRecipe;
}
