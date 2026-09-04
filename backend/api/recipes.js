const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const config = require("../data/config.js");

var lastUpdate = null;
var minuteUpdate = 5;
var cache = new Map();

// Function to get recipes from cache or API
async function getRecipes(force = false) {
  const currentDate = new Date();

  // Update cache if forced or if 2 hours have passed since the last update and the minute threshold has been reached
  if (
    force ||
    !lastUpdate ||
    (Math.abs(currentDate.getHours() - lastUpdate.getHours()) >= 2 &&
      currentDate.getMinutes() >= minuteUpdate)
  ) {
    console.log("Updating recipes cache...");

    try {
      // get recipes from api
      const newRecipes = await (
        await fetch(config.recipes_url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.MERC_API_TOKEN}`,
            "X-Merc-User": `${process.env.MERC_API_USER}`,
          },
        })
      ).json();

      // save recipes to local file
      fs.writeFileSync(
        path.join(__dirname, "../data/recipes.json"),
        JSON.stringify(newRecipes, null, 2),
      );

      // Clear old recipes and populate the cache with new ones
      cache.clear();
      Object.entries(newRecipes).forEach(([key, value]) => {
        // Handle empty input/output arrays
        if (!Array.isArray(value.inputs)) {
          value.inputs = [];
        }

        if (!Array.isArray(value.outputs)) {
          value.outputs = [];
        }

        // Convert prestige and health properties to outputs array items if they exist
        if (value.prestige != undefined) {
          value.outputs.push({ product: "prestige", amount: value.prestige });
          delete value.prestige;
        }

        if (value.health != undefined) {
          value.outputs.push({ product: "health", amount: value.health });
          delete value.health;
        }

        cache.set(key.toLowerCase(), value);
      });

      lastUpdate = currentDate;

      console.log("Recipes cache updated successfully.");

      return cache;
    } catch (error) {
      console.error("Error updating recipes cache:", error);
      return cache;
    }
  } else {
    return cache;
  }
}

// Get all recipes
// GET /api/recipes
router.get("/", async (req, res) => {
  try {
    const force = req.query.force === "true";
    const recipes = await getRecipes(force);

    res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get recipe by name
// GET /api/recipes/:name
router.get("/:name", async (req, res) => {
  try {
    const force = req.query.force === "true";
    const recipes = await getRecipes(force);
    const recipe = recipes.get(req.params.name.toLowerCase());
    if (recipe) {
      res.json(recipe);
    } else {
      res.status(404).json({ message: "Recipe not found" });
    }
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ message: "Internal server error" });
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
    res.status(500).json({ message: "Internal server error" });
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
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
