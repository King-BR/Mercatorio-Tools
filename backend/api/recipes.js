const express = require("express");

const { getRecipes } = require("../data/getters.js");

const router = express.Router();

// GET /api/recipes
router.get("/", async (req, res) => {
  try {
    const force = req.query.force === "true";
    const recipes = await getRecipes(force);

    res.json(Array.from(recipes.values()));
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Get recipes by input product
// GET /api/recipes/input/:product
router.get("/input/:product", async (req, res) => {
  try {
    const force = req.query.force === "true";
    const recipesMap = await getRecipes(force);
    const recipes = Array.from(recipesMap.values());
    const product = req.params.product.toLowerCase();
    const filteredRecipes = recipes.filter((recipe) =>
      recipe.inputs.some((input) => input.product.toLowerCase() === product),
    );

    res.json(filteredRecipes);
  } catch (error) {
    console.error("Error fetching recipes by input product:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Get recipes by output product
// GET /api/recipes/output/:product
router.get("/output/:product", async (req, res) => {
  try {
    const force = req.query.force === "true";
    const recipesMap = await getRecipes(force);
    const recipes = Array.from(recipesMap.values());
    const product = req.params.product.toLowerCase();
    const filteredRecipes = recipes.filter((recipe) =>
      recipe.outputs.some((output) => output.product.toLowerCase() === product),
    );
    res.json(filteredRecipes);
  } catch (error) {
    console.error("Error fetching recipes by output product:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
