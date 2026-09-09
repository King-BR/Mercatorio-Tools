import { getRecipes, getProducts } from "../api";

export async function buildRecipeIndex() {
  const [recipesData, productsData] = await Promise.all([
    getRecipes(),
    getProducts(),
  ]);

  const recipes = normalizeRecipes(recipesData);
  const normalizedProducts = Array.isArray(productsData) ? productsData : [];

  const productRecipes = {};
  const recipeProducts = {};

  for (const recipe of recipes) {
    if (!recipe || !recipe.name) {
      continue;
    }

    if (!Array.isArray(recipe.outputs) || recipe.outputs.length === 0) {
      continue;
    }

    const outputs = recipe.outputs
      .filter(
        (output) =>
          output &&
          typeof output.product === "string" &&
          output.product.length > 0,
      )
      .map((output) => ({
        product: output.product,
        amount: Number(output.amount) || 0,
      }));

    if (outputs.length === 0) {
      continue;
    }

    recipeProducts[recipe.name] = outputs;

    for (const output of outputs) {
      if (!productRecipes[output.product]) {
        productRecipes[output.product] = [];
      }

      if (!productRecipes[output.product].includes(recipe.name)) {
        productRecipes[output.product].push(recipe.name);
      }
    }
  }

  /*
   * Products returned by /api/products.
   *
   * We also add products found in recipe outputs so the planner
   * doesn't depend entirely on the products endpoint having every
   * production output.
   */
  const productSet = new Set(
    normalizedProducts
      .map((product) => {
        if (typeof product === "string") {
          return product;
        }

        return product?.name;
      })
      .filter(Boolean),
  );

  for (const product of Object.keys(productRecipes)) {
    productSet.add(product);
  }

  const products = [...productSet].sort((a, b) => a.localeCompare(b));

  return {
    recipes,
    productsData: normalizedProducts,
    products,
    productRecipes,
    recipeProducts,
  };
}

export function getRecipesForProduct(recipeIndex, product) {
  if (!recipeIndex || !product) {
    return [];
  }

  return recipeIndex.productRecipes?.[product] || [];
}

export function getRecipeOutput(recipe, product) {
  if (!recipe?.outputs || !Array.isArray(recipe.outputs)) {
    return null;
  }

  return recipe.outputs.find((output) => output?.product === product) || null;
}

function normalizeRecipes(recipesData) {
  /*
   * The API may return either:
   *
   * [
   *   { name: "recipe 1", ... }
   * ]
   *
   * or:
   *
   * {
   *   "recipe 1": { ... },
   *   "recipe 2": { ... }
   * }
   */

  if (Array.isArray(recipesData)) {
    return recipesData;
  }

  if (recipesData && typeof recipesData === "object") {
    return Object.entries(recipesData).map(([id, recipe]) => ({
      ...recipe,
      name: recipe?.name || id,
    }));
  }

  return [];
}
