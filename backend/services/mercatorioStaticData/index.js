const fs = require("fs");
const path = require("path");

const { discoverJavaScriptAssets, downloadAssets } = require("./crawler");

const { extractJSONParses } = require("./jsonParser");

const {
  classifyDataset,
  detectGameConfig,
  extractGameConfigDatasets,
  collectIdentifiers,
  getValueStats,
  TYPE_LABELS,
} = require("./classifier");

const BASE_DIRECTORY = path.resolve(__dirname, "../../data/mercatorio");

const RAW_DIRECTORY = path.join(BASE_DIRECTORY, "raw");

const PARSED_DIRECTORY = path.join(BASE_DIRECTORY, "parsed");

const IDENTIFIED_DIRECTORY = path.join(BASE_DIRECTORY, "identified");

const INDEX_FILE = path.join(BASE_DIRECTORY, "index.json");

let refreshPromise = null;

function ensureDirectories() {
  fs.mkdirSync(RAW_DIRECTORY, {
    recursive: true,
  });

  fs.mkdirSync(PARSED_DIRECTORY, {
    recursive: true,
  });

  fs.mkdirSync(IDENTIFIED_DIRECTORY, {
    recursive: true,
  });
}

function sanitizeFilename(filename) {
  return String(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function sanitizeDatasetType(type) {
  return String(type).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getDatasetId(assetFilename, index) {
  return `${assetFilename}:${index}`;
}

function getIdentifiedDatasetId(sourceId, dataPath) {
  return `${sourceId}/${dataPath}`;
}

function parseDatasetId(id) {
  const separatorIndex = id.lastIndexOf(":");

  if (separatorIndex === -1) {
    return null;
  }

  const filename = id.slice(0, separatorIndex);

  const index = Number(id.slice(separatorIndex + 1));

  if (!Number.isInteger(index) || index < 0) {
    return null;
  }

  return {
    filename,
    index,
  };
}

function getAssetDataPath(assetFilename, sourceIndex) {
  return path.join(
    PARSED_DIRECTORY,
    `${sanitizeFilename(assetFilename)}_${sourceIndex}.json`,
  );
}

function createContext(extractedDatasets) {
  const context = {
    productIds: new Set(),
    buildingIds: new Set(),
    recipeIds: new Set(),
  };

  /*
   * First use the explicit game config datasets.
   */
  for (const dataset of extractedDatasets) {
    if (dataset.type === "products") {
      for (const id of collectIdentifiers(dataset.data)) {
        context.productIds.add(id);
      }
    }

    if (dataset.type === "buildings") {
      for (const id of collectIdentifiers(dataset.data)) {
        context.buildingIds.add(id);
      }
    }

    if (dataset.type === "recipes") {
      for (const id of collectIdentifiers(dataset.data)) {
        context.recipeIds.add(id);
      }
    }
  }

  /*
   * Also use all datasets classified as products/buildings/recipes.
   */
  for (const dataset of extractedDatasets) {
    if (dataset.classification?.type === "products") {
      for (const id of collectIdentifiers(dataset.data)) {
        context.productIds.add(id);
      }
    }

    if (dataset.classification?.type === "buildings") {
      for (const id of collectIdentifiers(dataset.data)) {
        context.buildingIds.add(id);
      }
    }

    if (dataset.classification?.type === "recipes") {
      for (const id of collectIdentifiers(dataset.data)) {
        context.recipeIds.add(id);
      }
    }
  }

  return context;
}

function createIdentifiedEntry({
  sourceId,
  asset,
  sourceIndex,
  dataPath,
  type,
  confidence,
  reason,
  data,
}) {
  const filename = `${sanitizeFilename(asset.filename)}_${sourceIndex}_${sanitizeDatasetType(
    dataPath,
  )}.json`;

  const filePath = path.join(IDENTIFIED_DIRECTORY, filename);

  writeJson(filePath, data);

  return {
    id: getIdentifiedDatasetId(sourceId, dataPath),

    sourceId,

    asset: {
      filename: asset.filename,
      url: asset.url,
    },

    sourceIndex,

    path: dataPath,

    type,

    label: TYPE_LABELS[type] || type,

    confidence,

    reason,

    stats: getValueStats(data),

    file: filename,
  };
}

/**
 * Create the datasets that are known from the
 * Mercatorio game configuration.
 */
function extractKnownDatasets({ sourceDataset, asset }) {
  const config = detectGameConfig(sourceDataset.data);

  if (!config) {
    return [];
  }

  const children = extractGameConfigDatasets(sourceDataset.data);

  const result = [];

  /*
   * Store the complete game config.
   */
  result.push(
    createIdentifiedEntry({
      sourceId: sourceDataset.id,

      asset,

      sourceIndex: sourceDataset.sourceIndex,

      dataPath: "",

      type: "game_config",

      confidence: config.confidence,

      reason: config.reason,

      data: sourceDataset.data,
    }),
  );

  /*
   * Store each known child.
   */
  for (const child of children) {
    result.push(
      createIdentifiedEntry({
        sourceId: sourceDataset.id,

        asset,

        sourceIndex: sourceDataset.sourceIndex,

        dataPath: child.path,

        type: child.type,

        confidence: child.confidence,

        reason: child.reason,

        data: child.data,
      }),
    );
  }

  return result;
}

async function refresh(options = {}) {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    ensureDirectories();

    console.log("[MercatorioStaticData] Discovering JavaScript assets...");

    const assets = await discoverJavaScriptAssets({
      websiteUrl: options.websiteUrl || "https://play.mercatorio.io/",

      maxDepth: options.maxDepth === undefined ? 3 : options.maxDepth,
    });

    console.log(
      `[MercatorioStaticData] Found ${assets.length} JavaScript assets.`,
    );

    const downloadedAssets = await downloadAssets(assets, RAW_DIRECTORY);

    /*
     * ----------------------------------------------------------
     * PASS 1
     *
     * Extract every JSON.parse dataset.
     * ----------------------------------------------------------
     */

    const extractedDatasets = [];

    for (const asset of downloadedAssets) {
      let source;

      try {
        source = fs.readFileSync(asset.path, "utf8");
      } catch (error) {
        console.error(
          `[MercatorioStaticData] Failed to read ${asset.path}:`,
          error,
        );

        continue;
      }

      const extracted = extractJSONParses(source);

      for (const parsed of extracted) {
        if (!parsed.valid) {
          continue;
        }

        const id = getDatasetId(asset.filename, parsed.index);

        const parsedFilename = `${sanitizeFilename(asset.filename)}_${parsed.index}.json`;

        const parsedPath = path.join(PARSED_DIRECTORY, parsedFilename);

        writeJson(parsedPath, parsed.data);

        const dataset = {
          id,

          asset: {
            filename: asset.filename,

            url: asset.url,

            path: asset.path,
          },

          sourceIndex: parsed.index,

          type: parsed.type,

          data: parsed.data,

          file: parsedFilename,
        };

        extractedDatasets.push(dataset);
      }
    }

    console.log(
      `[MercatorioStaticData] Extracted ${extractedDatasets.length} JSON datasets.`,
    );

    /*
     * ----------------------------------------------------------
     * PASS 2
     *
     * Build a context containing known product/building/recipe
     * identifiers.
     * ----------------------------------------------------------
     */

    const context = createContext(extractedDatasets);

    console.log(
      `[MercatorioStaticData] Known product identifiers: ${context.productIds.size}`,
    );

    console.log(
      `[MercatorioStaticData] Known building identifiers: ${context.buildingIds.size}`,
    );

    console.log(
      `[MercatorioStaticData] Known recipe identifiers: ${context.recipeIds.size}`,
    );

    /*
     * ----------------------------------------------------------
     * PASS 3
     *
     * Classify all generic datasets.
     * ----------------------------------------------------------
     */

    for (const dataset of extractedDatasets) {
      dataset.classification = classifyDataset(dataset.data, context);
    }

    /*
     * ----------------------------------------------------------
     * PASS 4
     *
     * Extract the known datasets from the game config.
     * ----------------------------------------------------------
     */

    const identifiedDatasets = [];

    for (const dataset of extractedDatasets) {
      const config = detectGameConfig(dataset.data);

      if (!config) {
        continue;
      }

      const known = extractKnownDatasets({
        sourceDataset: dataset,

        asset: dataset.asset,
      });

      identifiedDatasets.push(...known);
    }

    /*
     * ----------------------------------------------------------
     * PASS 5
     *
     * Add the independently extracted datasets.
     *
     * Avoid duplicating the game config children.
     * ----------------------------------------------------------
     */

    const knownSourcePaths = new Set(
      identifiedDatasets.map(
        (dataset) => `${dataset.sourceId}|${dataset.path}`,
      ),
    );

    for (const dataset of extractedDatasets) {
      const classification = dataset.classification;

      const key = `${dataset.id}|`;

      /*
       * Don't duplicate the complete game config.
       */
      if (classification.type === "game_config") {
        continue;
      }

      /*
       * This dataset itself might be a normal
       * identified dataset.
       */
      if (classification.type !== "unknown") {
        const alreadyExists = identifiedDatasets.some(
          (item) => item.sourceId === dataset.id && item.path === "",
        );

        if (!alreadyExists) {
          const identified = createIdentifiedEntry({
            sourceId: dataset.id,

            asset: dataset.asset,

            sourceIndex: dataset.sourceIndex,

            dataPath: "",

            type: classification.type,

            confidence: classification.confidence,

            reason: classification.reason,

            data: dataset.data,
          });

          identifiedDatasets.push(identified);
        }
      }
    }

    /*
     * ----------------------------------------------------------
     * Remove old duplicate identified files from previous
     * refreshes.
     *
     * Only JSON files are removed.
     * ----------------------------------------------------------
     */

    const existingIdentifiedFiles = fs.readdirSync(IDENTIFIED_DIRECTORY);

    const currentFiles = new Set(
      identifiedDatasets.map((dataset) => dataset.file),
    );

    for (const filename of existingIdentifiedFiles) {
      if (!filename.endsWith(".json")) {
        continue;
      }

      if (!currentFiles.has(filename)) {
        try {
          fs.unlinkSync(path.join(IDENTIFIED_DIRECTORY, filename));
        } catch (error) {
          console.error(
            `[MercatorioStaticData] Failed to remove old identified file ${filename}:`,
            error,
          );
        }
      }
    }

    /*
     * ----------------------------------------------------------
     * Build index.
     * ----------------------------------------------------------
     */

    const index = {
      generatedAt: new Date().toISOString(),

      website: options.websiteUrl || "https://play.mercatorio.io/",

      assets: downloadedAssets.map((asset) => ({
        filename: asset.filename,

        url: asset.url,

        path: asset.path,
      })),

      datasetCount: extractedDatasets.length,

      identifiedDatasetCount: identifiedDatasets.length,

      datasets: extractedDatasets.map((dataset) => ({
        id: dataset.id,

        asset: dataset.asset,

        sourceIndex: dataset.sourceIndex,

        type: dataset.type,

        classification: dataset.classification,

        stats: getValueStats(dataset.data),

        file: dataset.file,
      })),

      identified: identifiedDatasets,
    };

    writeJson(INDEX_FILE, index);

    console.log(
      `[MercatorioStaticData] Identified ${identifiedDatasets.length} datasets.`,
    );

    console.log("[MercatorioStaticData] Refresh complete.");

    return index;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function getIndex() {
  ensureDirectories();

  if (!fs.existsSync(INDEX_FILE)) {
    return null;
  }

  return readJson(INDEX_FILE);
}

function listDatasets(options = {}) {
  const index = getIndex();

  if (!index) {
    return [];
  }

  let datasets = index.datasets || [];

  if (options.type) {
    datasets = datasets.filter(
      (dataset) => dataset.classification?.type === options.type,
    );
  }

  return datasets;
}

function listIdentifiedDatasets(options = {}) {
  const index = getIndex();

  if (!index) {
    return [];
  }

  let datasets = index.identified || [];

  if (options.type) {
    datasets = datasets.filter((dataset) => dataset.type === options.type);
  }

  return datasets;
}

function getDataset(id) {
  const index = getIndex();

  if (!index) {
    return null;
  }

  const dataset = index.datasets.find((item) => item.id === id);

  if (!dataset) {
    return null;
  }

  const parsed = parseDatasetId(id);

  if (!parsed) {
    return null;
  }

  const filePath = path.join(PARSED_DIRECTORY, dataset.file);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return {
    metadata: dataset,

    data: readJson(filePath),
  };
}

function getIdentifiedDataset(id) {
  const index = getIndex();

  if (!index) {
    return null;
  }

  const dataset = index.identified?.find((item) => item.id === id);

  if (!dataset) {
    return null;
  }

  const filePath = path.join(IDENTIFIED_DIRECTORY, dataset.file);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return {
    metadata: dataset,

    data: readJson(filePath),
  };
}

function getDatasetsByType(type) {
  return listDatasets({
    type,
  });
}

function getIdentifiedByType(type) {
  return listIdentifiedDatasets({
    type,
  });
}

module.exports = {
  refresh,

  getIndex,

  listDatasets,
  getDataset,
  getDatasetsByType,

  listIdentifiedDatasets,
  getIdentifiedDataset,
  getIdentifiedByType,
};
