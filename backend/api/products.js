const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// GET /api/products
router.get("/", (req, res) => {
  try {
    var recipes = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/recipes.json")),
    );

    var products = new Set(["prestige", "health"]);

    recipes.forEach((recipe) => {
      recipe.inputs.forEach((input) => products.add(input.product));
      recipe.outputs.forEach((output) => products.add(output.product));
    });

    res.json(Array.from(products));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
