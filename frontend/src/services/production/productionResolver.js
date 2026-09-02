import { getRecipesForProduct, getRecipeOutput } from "./recipeIndex";

export function getProductOptions(product, recipeIndex, context = {}) {
  const recipes = getRecipesForProduct(recipeIndex, product);

  return {
    product,
    canBuy: true,
    recipes,
  };
}

export function findRecipeForProduct(recipes, recipeId, product) {
  const recipe = recipes[recipeId];

  if (!recipe) {
    return null;
  }

  const output = getRecipeOutput(recipe, product);

  if (!output) {
    return null;
  }

  return {
    id: recipeId,
    recipe,
    output,
  };
}
