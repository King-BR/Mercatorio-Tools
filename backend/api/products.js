const express = require("express");

const { getProducts } = require("../data/getters.js");

const router = express.Router();

// GET /api/products
router.get("/", (req, res) => {
  try {
    res.json(Array.from(getProducts().values()));
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/products/:name
router.get("/:name", (req, res) => {
  try {
    const name = req.params.name.toLowerCase();
    const products = getProducts();
    const product = products.get(name);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// GET /api/products/class/:className
router.get("/class/:className", (req, res) => {
  try {
    const className = req.params.className.toLowerCase();
    const products = getProducts();
    const filteredProducts = Array.from(products.values()).filter((p) =>
      p.classes.map((c) => c.toLowerCase()).includes(className),
    );

    if (filteredProducts.length === 0) {
      res.status(404).json({ message: "No products found for this class" });
      return;
    }

    res.json(filteredProducts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
