export function buildRecipeIndex(recipes) {
  const productRecipes = {};
  const recipeProducts = {};
  const products = new Set();

  for (const [recipeId, recipe] of Object.entries(recipes)) {
    if (!recipe || !Array.isArray(recipe.outputs)) {
      continue;
    }

    if (recipe.outputs.length === 0) {
      continue;
    }

    recipeProducts[recipeId] = recipe.outputs.map((output) => ({
      product: output.product,
      amount: Number(output.amount) || 0,
    }));

    for (const output of recipe.outputs) {
      if (!output?.product) {
        continue;
      }

      if (!productRecipes[output.product]) {
        productRecipes[output.product] = [];
      }

      productRecipes[output.product].push(recipeId);

      if (!products.has(output.product)) products.add(output.product);
    }
  }

  return {
    productRecipes,
    recipeProducts,
    products: Array.from(products),
  };
}

export function getRecipesForProduct(recipeIndex, product) {
  return recipeIndex.productRecipes[product] || [];
}

export function getProducts(recipeIndex) {
  return recipeIndex.products || [];
}

export function getRecipeOutput(recipe, product) {
  if (!recipe?.outputs) {
    return null;
  }

  return recipe.outputs.find((output) => output.product === product) || null;
}
