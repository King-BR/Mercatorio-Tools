export function buildProductionGraph(recipes, calculation) {
  const nodes = [];
  const edges = [];

  let nodeIndex = 0;

  const nodePositions = new Map();

  function createId(prefix) {
    nodeIndex++;

    return `${prefix}-${nodeIndex}`;
  }

  function addNode(node) {
    nodes.push(node);
    return node.id;
  }

  function getPosition(level, index) {
    return {
      x: level * 350,
      y: index * 180,
    };
  }

  /*
   * Primeiro criamos os nós das receitas.
   */
  const recipeNodes = {};

  for (const [recipeId, recipeData] of Object.entries(calculation.recipes)) {
    const id = createId("recipe");

    recipeNodes[recipeId] = id;

    const index = nodes.length;

    addNode({
      id,

      type: "recipe",

      position: getPosition(1, index),

      data: {
        recipeId,
        name: recipeData.name || recipeId,

        runs: recipeData.runs,

        inputs: recipeData.inputs,

        outputs: recipeData.outputs,
      },
    });
  }

  /*
   * Cria nós de produtos.
   */
  const productNodes = {};

  for (const [product, data] of Object.entries(calculation.products)) {
    const id = createId("product");

    productNodes[product] = id;

    let source = data.source;

    if (calculation.purchases[product]) {
      source = "buy";
    }

    addNode({
      id,

      type: "product",

      position: getPosition(0, nodes.length),

      data: {
        product,

        source,

        required: data.required || 0,

        produced: data.produced || 0,

        purchased: data.purchased || 0,
      },
    });
  }

  /*
   * Liga produtos às receitas.
   */
  for (const [recipeId, recipeData] of Object.entries(calculation.recipes)) {
    const recipeNode = recipeNodes[recipeId];

    /*
     * INPUT:
     *
     * Product -> Recipe
     */
    for (const product of Object.keys(recipeData.inputs || {})) {
      if (!productNodes[product]) {
        continue;
      }

      edges.push({
        id: `edge-input-${recipeId}-${product}`,

        source: productNodes[product],

        sourceHandle: "output",

        target: recipeNode,

        targetHandle: "input",

        animated: false,

        label: formatAmount(recipeData.inputs[product]),
      });
    }

    /*
     * OUTPUT:
     *
     * Recipe -> Product
     */
    for (const product of Object.keys(recipeData.outputs || {})) {
      if (!productNodes[product]) {
        continue;
      }
      edges.push({
        id: `edge-output-${recipeId}-${product}`,

        source: recipeNode,

        sourceHandle: "output",

        target: productNodes[product],

        targetHandle: "input",

        animated: false,

        label: formatAmount(recipeData.outputs[product]),
      });
    }
  }

  return {
    nodes,
    edges,
  };
}

function formatAmount(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "";
  }

  return Number(value.toFixed(3)).toString();
}
