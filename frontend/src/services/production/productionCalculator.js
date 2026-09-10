import { getRecipeInputs, getRecipeOutput } from "./recipeIndex";

const RECIPE_STEP = 0.1;
const MAX_DECIMALS = 3;
const EPSILON = 1e-9;
const LABOUR = "labour";

function round(value, decimals = MAX_DECIMALS) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** decimals;

  return Math.round((value + EPSILON) * factor) / factor;
}

function ceilToStep(value, step) {
  if (value <= 0) {
    return 0;
  }

  return Math.ceil((value - EPSILON) / step) * step;
}

function ceilInteger(value) {
  if (value <= 0) {
    return 0;
  }

  return Math.ceil(value - EPSILON);
}

function addToMap(map, key, amount) {
  if (!key || !amount) {
    return;
  }

  map[key] = round((map[key] || 0) + amount);
}

function getProductPrice(product, productsData) {
  const data = productsData?.find(
    (item) => item?.name === product || item?.product === product,
  );

  if (!data) {
    return null;
  }

  const price = data.price.typical;

  const numericPrice = Number(price);

  return Number.isFinite(numericPrice) ? numericPrice : null;
}

function normalizeSource(source) {
  /*
   * Products discovered as inputs are BUY by default.
   *
   * The target product is handled separately by
   * resolveProduct(), so this default does not affect
   * the target.
   */
  if (!source) {
    return {
      type: "buy",
      recipeId: null,
    };
  }

  if (typeof source === "string") {
    return {
      type: source === "produce" ? "produce" : "buy",
      recipeId: null,
    };
  }

  return {
    type: source.type === "produce" ? "produce" : "buy",
    recipeId: source.recipeId || null,
  };
}

export function calculateProduction(recipes, recipeIndex, options = {}) {
  const { product, amount, recipeId = null, productSources = {} } = options;

  const requestedAmount = round(Number(amount) || 0);

  const result = {
    target: {
      product,
      amount: requestedAmount,
      produced: 0,
      surplus: 0,
    },

    recipes: {},

    products: {},

    purchases: {},

    surplus: {
      market: {},
      production: {},
    },

    labour: {
      total: 0,
      perProduct: 0,
    },

    cost: {
      total: null,
      unit: null,
    },

    errors: [],
  };

  const resolving = new Set();

  function getRecipe(id) {
    if (!id) {
      return null;
    }

    if (recipeIndex?.recipeMap?.[id]) {
      return recipeIndex.recipeMap[id];
    }

    if (recipes && !Array.isArray(recipes) && recipes[id]) {
      return recipes[id];
    }

    if (Array.isArray(recipes)) {
      return recipes.find((recipe) => recipe?.name === id) || null;
    }

    return null;
  }

  function getAvailableRecipes(productName) {
    return recipeIndex?.productRecipes?.[productName] || [];
  }

  function getSelectedRecipe(productName, contextRecipeId) {
    if (contextRecipeId) {
      return contextRecipeId;
    }

    const source = normalizeSource(productSources?.[productName]);

    if (source.recipeId) {
      return source.recipeId;
    }

    return getAvailableRecipes(productName)[0] || null;
  }

  function ensureProduct(productName, source) {
    if (!result.products[productName]) {
      result.products[productName] = {
        product: productName,
        source,
        required: 0,
        produced: 0,
        purchased: 0,
        marketSurplus: 0,
        productionSurplus: 0,
        isTarget: productName === product,
      };
    }

    return result.products[productName];
  }

  function registerRequired(productName, amountRequired, source) {
    const data = ensureProduct(productName, source);

    data.required = round(data.required + amountRequired);

    return data;
  }

  function buyProduct(productName, requiredAmount) {
    const purchaseAmount = ceilInteger(requiredAmount);

    const surplus = round(purchaseAmount - requiredAmount);

    addToMap(result.purchases, productName, purchaseAmount);

    if (surplus > 0) {
      addToMap(result.surplus.market, productName, surplus);
    }

    const data = registerRequired(productName, requiredAmount, "buy");

    data.purchased = round(data.purchased + purchaseAmount);

    data.marketSurplus = round(data.marketSurplus + surplus);

    return {
      purchased: purchaseAmount,
      surplus,
    };
  }

  function produceProduct(productName, requiredAmount, context = {}) {
    const selectedRecipeId = getSelectedRecipe(productName, context.recipeId);

    if (!selectedRecipeId) {
      result.errors.push({
        type: "missing-recipe",
        product: productName,
        message: `No recipe is available for ${productName}.`,
      });

      buyProduct(productName, requiredAmount);

      return;
    }

    const recipe = getRecipe(selectedRecipeId);

    if (!recipe) {
      result.errors.push({
        type: "missing-recipe",
        product: productName,
        message: `Recipe "${selectedRecipeId}" could not be found.`,
      });

      buyProduct(productName, requiredAmount);

      return;
    }

    const output = getRecipeOutput(recipe, productName);

    if (!output || Number(output.amount) <= 0) {
      result.errors.push({
        type: "invalid-recipe-output",
        product: productName,
        recipe: selectedRecipeId,
        message: `Recipe "${selectedRecipeId}" does not produce ${productName}.`,
      });

      buyProduct(productName, requiredAmount);

      return;
    }

    const outputPerRun = Number(output.amount);

    /*
     * The game only allows recipe executions
     * in increments of 0.10.
     */
    const rawRuns = requiredAmount / outputPerRun;

    const runs = round(ceilToStep(rawRuns, RECIPE_STEP), 1);

    if (runs <= 0) {
      return;
    }

    const resolvingKey = `${productName}::${selectedRecipeId}`;

    if (resolving.has(resolvingKey)) {
      result.errors.push({
        type: "circular-dependency",
        product: productName,
        recipe: selectedRecipeId,
        message: `Circular production dependency detected while producing ${productName}.`,
      });

      return;
    }

    resolving.add(resolvingKey);

    const totalOutput = round(outputPerRun * runs);

    const productionSurplus = round(totalOutput - requiredAmount);

    const productData = registerRequired(
      productName,
      requiredAmount,
      "produce",
    );

    productData.produced = round(productData.produced + totalOutput);

    productData.productionSurplus = round(
      productData.productionSurplus + productionSurplus,
    );

    if (productionSurplus > 0) {
      addToMap(result.surplus.production, productName, productionSurplus);
    }

    if (!result.recipes[selectedRecipeId]) {
      result.recipes[selectedRecipeId] = {
        name: selectedRecipeId,
        site: recipes[selectedRecipeId].site,
        runs: 0,
        inputs: {},
        outputs: {},
      };
    }

    const recipeResult = result.recipes[selectedRecipeId];

    recipeResult.runs = round(recipeResult.runs + runs, 1);

    /*
     * Register every recipe output.
     */
    for (const recipeOutput of recipe.outputs || []) {
      const outputProduct = recipeOutput?.product;

      const outputAmount = Number(recipeOutput?.amount) || 0;

      if (!outputProduct || outputAmount <= 0) {
        continue;
      }

      const total = round(outputAmount * runs);

      addToMap(recipeResult.outputs, outputProduct, total);

      /*
       * The selected output has already been
       * accounted for above.
       *
       * Other outputs are surplus because they
       * are not required by this particular
       * production branch.
       */
      if (outputProduct !== productName) {
        addToMap(result.surplus.production, outputProduct, total);

        const otherProduct = ensureProduct(outputProduct, "produce");

        otherProduct.produced = round(otherProduct.produced + total);

        otherProduct.productionSurplus = round(
          otherProduct.productionSurplus + total,
        );
      }
    }

    /*
     * Resolve recipe inputs.
     */
    const inputs = getRecipeInputs(recipe);

    for (const input of inputs) {
      const inputProduct = input.product;

      const inputAmount = round(input.amount * runs);

      if (inputAmount <= 0) {
        continue;
      }

      addToMap(recipeResult.inputs, inputProduct, inputAmount);

      resolveProduct(inputProduct, inputAmount, {
        isInput: true,
      });
    }

    resolving.delete(resolvingKey);
  }

  function resolveProduct(productName, requiredAmount, context = {}) {
    const amountRequired = round(requiredAmount);

    if (!productName || amountRequired <= 0) {
      return;
    }

    /*
     * Labour is always bought when it is
     * an input.
     */
    if (productName === LABOUR && context.isInput) {
      buyProduct(productName, amountRequired);

      return;
    }

    const source = normalizeSource(productSources?.[productName]);

    /*
     * The final target must always be produced.
     *
     * This takes priority even if the target was
     * accidentally configured as "buy".
     */
    const isTarget = !context.isInput && productName === product;

    if (isTarget) {
      produceProduct(productName, amountRequired, {
        recipeId: recipeId || source.recipeId,
      });

      return;
    }

    /*
     * Explicitly configured as BUY.
     */
    if (source.type === "buy") {
      buyProduct(productName, amountRequired);

      return;
    }

    /*
     * Explicitly configured as PRODUCE.
     */
    if (source.type === "produce") {
      produceProduct(productName, amountRequired, {
        recipeId: source.recipeId,
      });

      return;
    }

    /*
     * No explicit source.
     *
     * Products discovered as recipe inputs are
     * BUY by default.
     */
    buyProduct(productName, amountRequired);
  }

  /*
   * Start calculation.
   *
   * The target is always produced.
   */
  if (product && requestedAmount > 0) {
    resolveProduct(product, requestedAmount, {
      isInput: false,
      recipeId,
    });
  }

  /*
   * Target statistics.
   */
  const targetData = result.products[product];

  if (targetData) {
    result.target.produced = round(targetData.produced);

    result.target.surplus = round(targetData.produced - requestedAmount);
  }

  /*
   * Labour summary.
   */
  result.labour.total = round(result.purchases[LABOUR] || 0);

  result.labour.perProduct =
    requestedAmount > 0 ? round(result.labour.total / targetData.produced) : 0;

  /*
   * Cost.
   */
  let totalCost = 0;
  let hasUnknownPrice = false;

  for (const [purchasedProduct, purchasedAmount] of Object.entries(
    result.purchases,
  )) {
    const price = getProductPrice(purchasedProduct, recipeIndex?.productsData);

    if (price == null) {
      hasUnknownPrice = true;
      continue;
    }

    totalCost += purchasedAmount * price;
  }

  if (!hasUnknownPrice) {
    result.cost.total = round(totalCost, 2);

    result.cost.unit =
      requestedAmount > 0 ? round(totalCost / targetData.produced, 2) : 0;
  }

  return result;
}
