const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// GET /api/recipes
router.get("/", (req, res) => {
  const recipes = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/recipes.json"), "utf8")
  );

  res.json(recipes);
});

// GET /api/recipes/:id
router.get("/:id", (req, res) => {
  const recipes = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/recipes.json"), "utf8")
  );
  const recipe = recipes.find(
    (r) => r.name === req.params.id.replace(/-/g, " ")
  );

  if (recipe) {
    res.json(recipe);
  } else {
    res.status(404).json({ message: "Recipe not found" });
  }
});

// GET /api/recipes/input/:id
router.get("/input/:id", (req, res) => {
  const recipes = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/recipes.json"), "utf8")
  );
  const recipesFiltered = recipes.map(
    (r) =>
      r.inputs &&
      r.inputs.lenght > 0 &&
      r.inputs.map((i) => i.product).includes(req.params.id.replace(/-/g, " "))
  );

  if (recipesFiltered) {
    res.json(recipesFiltered);
  } else {
    res.status(404).json({ message: "Recipe not found" });
  }
});

// GET /api/recipes/output/:id
router.get("/output/:id", (req, res) => {
  const recipes = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/recipes.json"), "utf8")
  );
  const recipesFiltered = recipes.map(
    (r) =>
      r.outputs &&
      r.outputs.lenght > 0 &&
      r.outputs.map((o) => o.product).includes(req.params.id.replace(/-/g, " "))
  );

  if (recipesFiltered) {
    res.json(recipesFiltered);
  } else {
    res.status(404).json({ message: "Recipe not found" });
  }
});

module.exports = router;
