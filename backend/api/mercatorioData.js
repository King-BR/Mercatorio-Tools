const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
  refresh,

  getIndex,

  listDatasets,
  getDataset,
  getDatasetsByType,

  listIdentifiedDatasets,
  getIdentifiedDataset,
  getIdentifiedByType,
} = require("../services/mercatorioStaticData");

const router = express.Router();

/*
 * GET /api/mercatorioData
 *
 * Complete index.
 */
router.get("/", (req, res) => {
  const index = getIndex();

  if (!index) {
    return res.status(404).json({
      error: "Mercatorio static data has not been loaded yet.",
    });
  }

  return res.json(index);
});

/*
 * GET /api/mercatorioData/datasets
 *
 * Raw extracted datasets.
 *
 * Optional:
 * ?type=recipes
 */
router.get("/datasets", (req, res) => {
  const type = req.query.type;

  if (type) {
    const byType = getDatasetsByType(type);

    byType.forEach((dataset) => {
      delete dataset.asset.path;
    });

    return res.json(byType);
  }

  const all = listDatasets();

  all.forEach((dataset) => {
    delete dataset.asset.path;
  });

  return res.json(all);
});

/*
 * GET /api/mercatorioData/datasets/:id
 *
 * Get a raw JSON.parse dataset.
 */
router.get("/datasets/:id", (req, res) => {
  const dataset = getDataset(req.params.id);

  if (!dataset) {
    return res.status(404).json({
      error: "Dataset not found.",
    });
  }

  return res.json(dataset);
});

/*
 * GET /api/mercatorioData/identified
 *
 * Datasets that have been identified.
 *
 * Optional:
 * ?type=products
 */
router.get("/identified", (req, res) => {
  const type = req.query.type;

  if (type) {
    return res.json(getIdentifiedByType(type));
  }

  return res.json(listIdentifiedDatasets());
});

/*
 * GET /api/mercatorioData/identified/:id
 *
 * Get an identified dataset.
 *
 * Example:
 *
 * /api/mercatorioData/identified/main.js:0/ZE
 */
router.get("/identified/:id(*)", (req, res) => {
  const dataset = getIdentifiedDataset(req.params.id);

  if (!dataset) {
    return res.status(404).json({
      error: "Identified dataset not found.",
    });
  }

  return res.json(dataset);
});

/*
 * POST /api/mercatorioData/refresh
 *
 * Re-download and analyze all game data.
 */
router.get("/refresh", auth, admin, async (req, res) => {
  try {
    const index = await refresh();

    return res.json({
      success: true,

      generatedAt: index.generatedAt,

      generatedAtISO: index.generatedAtISO,

      assetCount: index.assets.length,

      datasetCount: index.datasetCount,

      identifiedDatasetCount: index.identifiedDatasetCount,
    });
  } catch (error) {
    console.error("[MercatorioStaticData] Refresh failed:", error);

    return res.status(500).json({
      error: "Failed to refresh Mercatorio static data.",

      message: error.message,
    });
  }
});

module.exports = router;
