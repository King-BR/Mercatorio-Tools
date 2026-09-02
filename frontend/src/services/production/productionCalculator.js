import { getRecipesForProduct, getRecipeOutput } from "./recipeIndex";

function addToMap(map, key, amount) {
  map[key] = (map[key] || 0) + amount;
}

function cloneMap(map) {
  return Object.fromEntries(Object.entries(map));
}

/*
 * Calcula quantas vezes uma receita precisa ser executada
 * para produzir a quantidade desejada de determinado produto.
 */
function calculateRecipeRuns(recipe, product, requiredAmount) {
  const output = getRecipeOutput(recipe, product);

  if (!output || !output.amount) {
    throw new Error(`Recipe does not produce ${product}`);
  }

  return requiredAmount / output.amount;
}

/*
 * Calcula uma linha de produção inteira.
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
   * Controle de produtos que estão sendo resolvidos.
   *
   * Isso evita ciclos como:
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
     * Esta é a regra especial solicitada.
     *
     * Se labour for input:
     *
     *     BUY
     *
     * Se labour for o produto final:
     *
     *     pode produzir
     *
     * Nunca expandimos labour automaticamente quando
     * ele aparece como dependência.
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
     * Verifica se o usuário escolheu comprar.
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
     * Verifica se já existe um ciclo.
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
     * Se nenhuma receita foi selecionada,
     * usa a receita do alvo ou a primeira disponível.
     */
    if (!selectedRecipeId) {
      selectedRecipeId = context.recipeId;
    }

    const availableRecipes = getRecipesForProduct(recipeIndex, productName);

    if (!selectedRecipeId && availableRecipes.length > 0) {
      selectedRecipeId = availableRecipes[0];
    }

    /*
     * Produto sem receita.
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
     * Registra a receita.
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
     * Registra produto produzido.
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
     * Marca produto como sendo resolvido.
     */
    resolving.add(productName);

    /*
     * =====================================================
     * INPUTS
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
     * OUTPUTS
     * =====================================================
     *
     * A receita pode produzir vários produtos.
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
         * Se esse output não for o produto que
         * estamos tentando satisfazer, ele é
         * inicialmente considerado excedente.
         *
         * Uma etapa futura pode consumir esse
         * excedente em outra receita.
         */
        if (recipeOutput.product !== productName) {
          addToMap(result.surplus, recipeOutput.product, outputAmount);
        }
      }
    }

    resolving.delete(productName);
  }

  /*
   * O target é diferente de um input.
   *
   * Isso faz labour poder ser produzido.
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
