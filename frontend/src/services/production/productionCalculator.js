import { getRecipesForProduct, getRecipeOutput } from "./recipeIndex";

function addToMap(map, key, amount) {
  map[key] = (map[key] || 0) + amount;
}

function cloneMap(map) {
  return Object.fromEntries(Object.entries(map));
}

/*
 * Calculate the number of times a recipe needs to be executed
 * to produce the desired amount of a specific product.
 */
function calculateRecipeRuns(recipe, product, requiredAmount) {
  const output = getRecipeOutput(recipe, product);

  if (!output || !output.amount) {
    throw new Error(`Recipe does not produce ${product}`);
  }

  return requiredAmount / output.amount;
}

/*
 * Calculate an entire production line.
 *
 * options:
 *
 * {
 *   product: "bronze ingots",
 *   amount: 150,
 *   recipeId: "alloy bronze 1",
 *   productSources: {
 *      "charcoal": {
 *          type: "produce",
 *          recipeId: "charcoal 1"
 *      },
 *      "tools": {
 *          type: "buy"
 *      }
 *   }
 * }
 */
export function calculateProduction(recipes, recipeIndex, options) {
  const { product, amount, recipeId, productSources = {} } = options;

  const result = {
    target: {
      product,
      amount,
    },

    recipes: {},

    products: {},

    purchases: {},

    rawInputs: {},

    surplus: {},

    errors: [],
  };

  /*
   * Control of products that are being resolved.
   *
   * This prevents cycles like:
   *
   * A -> B -> C -> A
   */
  const resolving = new Set();

  function resolveProduct(productName, requiredAmount, context) {
    if (!productName) {
      return;
    }

    /*
     * =====================================================
     * LABOUR
     * =====================================================
     *
     * This is a special rule.
     *
     * If labour is an input:
     *
     *     BUY
     *
     * If labour is the final product:
     *
     *     PRODUCE
     *
     * We never automatically expand labour when
     * it appears as a dependency.
     */
    if (productName === "labour" && context.isInput) {
      addToMap(result.purchases, "labour", requiredAmount);

      if (!result.products.labour) {
        result.products.labour = {
          product: "labour",
          source: "buy",
          required: 0,
          produced: 0,
          purchased: 0,
        };
      }

      result.products.labour.required += requiredAmount;

      result.products.labour.purchased += requiredAmount;

      return;
    }

    /*
     * Check if the user chose to buy.
     */
    const source = productSources[productName];

    if (source?.type === "buy") {
      addToMap(result.purchases, productName, requiredAmount);

      if (!result.products[productName]) {
        result.products[productName] = {
          product: productName,
          source: "buy",
          required: 0,
          produced: 0,
          purchased: 0,
        };
      }

      result.products[productName].required += requiredAmount;

      result.products[productName].purchased += requiredAmount;

      return;
    }

    /*
     * Check if a cycle already exists.
     */
    if (resolving.has(productName)) {
      result.errors.push({
        type: "cycle",
        product: productName,
        message: `Production cycle detected involving "${productName}".`,
      });

      return;
    }

    let selectedRecipeId = source?.recipeId;

    /*
     * If no recipe was selected,
     * use the target's recipe or the first available one.
     */
    if (!selectedRecipeId) {
      selectedRecipeId = context.recipeId;
    }

    const availableRecipes = getRecipesForProduct(recipeIndex, productName);

    if (!selectedRecipeId && availableRecipes.length > 0) {
      selectedRecipeId = availableRecipes[0];
    }

    /*
     * Product without a recipe.
     */
    if (!selectedRecipeId) {
      result.rawInputs[productName] =
        (result.rawInputs[productName] || 0) + requiredAmount;

      if (!result.products[productName]) {
        result.products[productName] = {
          product: productName,
          source: "raw",
          required: 0,
          produced: 0,
          purchased: 0,
        };
      }

      result.products[productName].required += requiredAmount;

      return;
    }

    const recipe = recipes[selectedRecipeId];

    if (!recipe) {
      result.errors.push({
        type: "recipe-not-found",
        recipe: selectedRecipeId,
        product: productName,
      });

      return;
    }

    const output = getRecipeOutput(recipe, productName);

    if (!output) {
      result.errors.push({
        type: "invalid-recipe",
        recipe: selectedRecipeId,
        product: productName,
      });

      return;
    }

    const runs = calculateRecipeRuns(recipe, productName, requiredAmount);

    /*
     * Register the recipe.
     */
    if (!result.recipes[selectedRecipeId]) {
      result.recipes[selectedRecipeId] = {
        recipeId: selectedRecipeId,
        name: recipe.name,
        runs: 0,
        inputs: {},
        outputs: {},
      };
    }

    result.recipes[selectedRecipeId].runs += runs;

    /*
     * Register produced product.
     */
    if (!result.products[productName]) {
      result.products[productName] = {
        product: productName,
        source: "produce",
        required: 0,
        produced: 0,
        purchased: 0,
      };
    }

    result.products[productName].required += requiredAmount;

    result.products[productName].produced += output.amount * runs;

    /*
     * Mark product as being resolved.
     */
    resolving.add(productName);

    /*
     * =====================================================
     * INPUTS (Ingredients)
     * =====================================================
     */
    if (Array.isArray(recipe.inputs)) {
      for (const input of recipe.inputs) {
        if (!input || !input.product) {
          continue;
        }

        const inputAmount = (Number(input.amount) || 0) * runs;

        addToMap(
          result.recipes[selectedRecipeId].inputs,
          input.product,
          inputAmount,
        );

        resolveProduct(input.product, inputAmount, {
          isInput: true,
          parentProduct: productName,
          parentRecipe: selectedRecipeId,
        });
      }
    }

    /*
     * =====================================================
     * OUTPUTS (Products)
     * =====================================================
     *
     * The recipe can produce multiple products.
     */
    if (Array.isArray(recipe.outputs)) {
      for (const recipeOutput of recipe.outputs) {
        if (!recipeOutput || !recipeOutput.product) {
          continue;
        }

        const outputAmount = (Number(recipeOutput.amount) || 0) * runs;

        addToMap(
          result.recipes[selectedRecipeId].outputs,
          recipeOutput.product,
          outputAmount,
        );

        /*
         * If this output is not the product we
         * are trying to satisfy, it is
         * initially considered surplus.
         *
         * A future step may consume this
         * surplus in another recipe.
         */
        if (recipeOutput.product !== productName) {
          addToMap(result.surplus, recipeOutput.product, outputAmount);
        }
      }
    }

    resolving.delete(productName);
  }

  /*
   * The target is different from an input.
   *
   * This allows labour to be produced.
   */
  resolveProduct(product, amount, {
    isInput: false,
    isTarget: true,
    recipeId,
  });

  return {
    ...result,

    purchases: cloneMap(result.purchases),

    rawInputs: cloneMap(result.rawInputs),

    surplus: cloneMap(result.surplus),
  };
}
