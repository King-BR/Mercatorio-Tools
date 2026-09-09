const express = require("express");

const { getMarketData, getProducts } = require("../data/getters.js");

const router = express.Router();

// GET /api/markets/all
router.get("/all", (req, res) => {
  try {
    const data = getMarketData();
    res.json(Array.from(data.values()));
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/markets/:name
router.get("/town/:name", (req, res) => {
  try {
    if (!req.params.name) {
      return res.status(400).json({ message: "Town name is required" });
    }

    const data = getMarketData();
    const market = data.get(req.params.name.toLowerCase());
    if (!market) {
      return res.status(404).json({ message: "Town not found" });
    }
    res.json(market);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/markets/products/:productName/aggregate/:type/:value
router.get("/products/:productName/aggregate/:type/:value", (req, res) => {
  try {
    const { productName, type, value } = req.params;

    const data = getMarketData();
    const markets = Array.from(data.values());

    var products = Array.from(getProducts().keys()).map((product) =>
      product.name.toLowerCase(),
    );

    var types = ["average", "min", "max", "sum"];
    var values = [
      "price",
      "open_price",
      "last_price",
      "average_price",
      "moving_average",
      "price_ema_12",
      "price_ema_60",
      "highest_bid",
      "lowest_ask",
      "high_price",
      "low_price",
      "volume",
      "volume_prev_12",
      "volume_ema_12",
      "volume_ema_60",
      "bid_volume_10",
      "ask_volume_10",
    ];

    if (
      !productName ||
      !type ||
      !value ||
      !products.includes(productName.toLowerCase()) ||
      !types.includes(type.toLowerCase()) ||
      !values.includes(value)
    ) {
      return res.status(400).json({
        message: "Product name, type, and value are required or invalid",
        error: "Missing or invalid parameters",
        requested: { product: productName, type, value },
        available: { products, types, values },
      });
    }

    const filteredMarkets = markets.filter(
      (town) => town.market && town.market[productName.toLowerCase()],
    );

    if (filteredMarkets.length === 0) {
      return res
        .status(404)
        .json({ message: "No markets found for the specified product" });
    }

    let result;
    switch (type.toLowerCase()) {
      case "average":
        const total = filteredMarkets.reduce(
          (sum, town) =>
            town.market[productName.toLowerCase()][value] != undefined
              ? sum + town.market[productName.toLowerCase()][value]
              : sum,
          0,
        );
        result = total / filteredMarkets.length;
        break;
      case "min":
        result = Math.min(
          ...filteredMarkets.map(
            (town) => town.market[productName.toLowerCase()][value] || Infinity,
          ),
        );
        break;
      case "max":
        result = Math.max(
          ...filteredMarkets.map(
            (town) => town.market[productName.toLowerCase()][value] || 0,
          ),
        );
        break;
      case "sum":
        result = filteredMarkets.reduce(
          (sum, town) =>
            town.market[productName.toLowerCase()][value] != undefined
              ? sum + town.market[productName.toLowerCase()][value]
              : sum,
          0,
        );
        break;
      default:
        return res.status(400).json({ message: "Invalid aggregate type" });
    }

    res.json({ product: productName, type, result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
