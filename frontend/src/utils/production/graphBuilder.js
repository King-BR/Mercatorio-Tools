function createId(prefix, index) {
  return `${prefix}-${index}`;
}

function formatAmount(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "";
  }

  return Number(value.toFixed(3)).toString();
}

export function buildProductionGraph(recipes, calculation) {
  const nodes = [];
  const edges = [];

  let nodeIndex = 0;

  const productNodes = {};
  const recipeNodes = {};

  /*
   * ----------------------------------------------------
   * PRODUCT NODES
   * ----------------------------------------------------
   */

  for (const [product, data] of Object.entries(calculation?.products || {})) {
    const id = createId("product", ++nodeIndex);

    productNodes[product] = id;

    let source = data.source;

    if (calculation.purchases?.[product]) {
      source = "buy";
    }

    nodes.push({
      id,
      type: "product",

      position: {
        x: 0,
        y: 0,
      },

      data: {
        product,

        source,

        required: data.required || 0,

        produced: data.produced || 0,

        purchased: data.purchased || 0,

        marketSurplus: data.marketSurplus || 0,

        productionSurplus: data.productionSurplus || 0,
      },
    });
  }

  /*
   * ----------------------------------------------------
   * RECIPE NODES
   * ----------------------------------------------------
   */

  for (const [recipeId, data] of Object.entries(calculation?.recipes || {})) {
    const id = createId("recipe", ++nodeIndex);

    recipeNodes[recipeId] = id;

    nodes.push({
      id,
      type: "recipe",

      position: {
        x: 0,
        y: 0,
      },

      data: {
        recipeId,

        name: data.name || recipeId,

        runs: data.runs || 0,

        inputs: data.inputs || {},

        outputs: data.outputs || {},
      },
    });
  }

  /*
   * ----------------------------------------------------
   * EDGES
   * ----------------------------------------------------
   */

  for (const [recipeId, recipeData] of Object.entries(
    calculation?.recipes || {},
  )) {
    const recipeNode = recipeNodes[recipeId];

    if (!recipeNode) {
      continue;
    }

    /*
     * Product -> Recipe
     */
    for (const [product, amount] of Object.entries(recipeData.inputs || {})) {
      const productNode = productNodes[product];

      if (!productNode) {
        continue;
      }

      edges.push({
        id: `edge-input-${recipeId}-${product}`,

        source: productNode,

        sourceHandle: "output",

        target: recipeNode,

        targetHandle: "input",

        animated: false,

        label: formatAmount(amount),
      });
    }

    /*
     * Recipe -> Product
     */
    for (const [product, amount] of Object.entries(recipeData.outputs || {})) {
      const productNode = productNodes[product];

      if (!productNode) {
        continue;
      }

      edges.push({
        id: `edge-output-${recipeId}-${product}`,

        source: recipeNode,

        sourceHandle: "output",

        target: productNode,

        targetHandle: "input",

        animated: false,

        label: formatAmount(amount),
      });
    }
  }

  return {
    nodes,
    edges,
  };
}
