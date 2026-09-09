import { getProducts, getRecipes } from "../api";

function normalizeRecipes(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.recipes)) {
    return data.recipes;
  }

  return [];
}

function normalizeProducts(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  return [];
}

function getProductName(product) {
  if (typeof product === "string") {
    return product;
  }

  return product?.product ?? product?.name ?? null;
}

export async function buildRecipeIndex() {
  const [recipesResponse, productsResponse] = await Promise.all([
    getRecipes(),
    getProducts(),
  ]);

  const recipes = normalizeRecipes(recipesResponse);

  const productsData = normalizeProducts(productsResponse);

  const productRecipes = {};
  const recipeProducts = {};
  const recipeMap = {};

  for (const recipe of recipes) {
    if (!recipe?.name) {
      continue;
    }

    recipeMap[recipe.name] = recipe;

    const outputs = Array.isArray(recipe.outputs) ? recipe.outputs : [];

    recipeProducts[recipe.name] = outputs
      .map((output) => ({
        product: output?.product ?? getProductName(output),
        amount: Number(output?.amount) || 0,
      }))
      .filter((output) => output.product && output.amount > 0);

    for (const output of recipeProducts[recipe.name]) {
      if (!productRecipes[output.product]) {
        productRecipes[output.product] = [];
      }

      productRecipes[output.product].push(recipe.name);
    }
  }

  const products = [
    ...new Set([
      ...productsData.map((product) => getProductName(product)).filter(Boolean),

      ...Object.keys(productRecipes),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  return {
    recipes,
    recipeMap,
    productsData,
    products,
    productRecipes,
    recipeProducts,
  };
}

export function getRecipesForProduct(recipeIndex, product) {
  if (!product) {
    return [];
  }

  return recipeIndex?.productRecipes?.[product] || [];
}

export function getRecipeOutput(recipe, product) {
  if (!Array.isArray(recipe?.outputs)) {
    return null;
  }

  return recipe.outputs.find((output) => output?.product === product) || null;
}

export function getRecipeInputs(recipe) {
  if (!Array.isArray(recipe?.inputs)) {
    return [];
  }

  return recipe.inputs
    .map((input) => ({
      product: input?.product ?? input?.name ?? null,

      amount: Number(input?.amount) || 0,
    }))
    .filter((input) => input.product && input.amount > 0);
}
