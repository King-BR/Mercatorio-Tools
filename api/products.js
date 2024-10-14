const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// GET /api/products
router.get("/", (req, res) => {
  const raw_products = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/products.json"), "utf8")
  );

  var products = raw_products.map((product) => {
    return {
      id: product.split(" ").join("-").toLowerCase(),
      name: product,
    };
  });

  res.json(products);
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
  const raw_products = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/products.json"), "utf8")
  );
  const product = raw_products.find(
    (p) => p.split(" ").join("-").toLowerCase() === req.params.id
  );

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: "Product not found" });
  }
});

module.exports = router;
