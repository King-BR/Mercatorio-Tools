import { getRecipes, getProducts } from "../api";

export async function buildRecipeIndex() {
  const recipes = await getRecipes();
  const productsData = await getProducts();
  const products = productsData.map((product) => product.name);
  const productRecipes = {};
  const recipeProducts = {};

  for (const recipe of recipes) {
    if (!recipe || !Array.isArray(recipe.outputs)) {
      continue;
    }

    if (recipe.outputs.length === 0) {
      continue;
    }

    recipeProducts[recipe.name] = recipe.outputs.map((output) => ({
      product: output.product,
      amount: Number(output.amount) || 0,
    }));
  }

  return {
    productRecipes,
    recipeProducts,
    productsData,
    products,
  };
}

export function getRecipesForProduct(recipeIndex, product) {
  return recipeIndex.productRecipes[product] || [];
}

export function getRecipeOutput(recipe, product) {
  if (!recipe?.outputs) {
    return null;
  }

  return recipe.outputs.find((output) => output.product === product) || null;
}
