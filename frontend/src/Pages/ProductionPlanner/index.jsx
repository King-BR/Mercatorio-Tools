import { useEffect, useState } from "react";

import {
  buildRecipeIndex,
  getRecipesForProduct,
} from "../../services/production/recipeIndex";

import { calculateProduction } from "../../services/production/productionCalculator";

import { buildProductionGraph } from "../../utils/production/graphBuilder";

import ProductionGraph from "./components/ProductionGraph";
import ProductionSidebar from "./components/ProductionSidebar";

import "./ProductionPlanner.css";

export default function ProductionPlanner() {
  const [recipes, setRecipes] = useState({});
  const [recipeIndex, setRecipeIndex] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [product, setProduct] = useState("");
  const [amount, setAmount] = useState(1);

  const [recipeId, setRecipeId] = useState(null);
  const [productSources, setProductSources] = useState({});

  const [calculation, setCalculation] = useState(null);

  const [graph, setGraph] = useState({
    nodes: [],
    edges: [],
  });

  /*
   * Load production data.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadProductionData() {
      try {
        setLoading(true);
        setLoadError(null);

        const index = await buildRecipeIndex();

        if (cancelled) {
          return;
        }

        setRecipeIndex(index);

        /*
         * The calculator expects recipes indexed by recipe name.
         *
         * buildRecipeIndex() normalizes recipes into an array,
         * so convert them to an object here.
         */
        const recipeMap = {};

        for (const recipe of index.recipes) {
          if (!recipe?.name) {
            continue;
          }

          recipeMap[recipe.name] = recipe;
        }

        setRecipes(recipeMap);

        /*
         * Select the first available product automatically.
         */
        if (index.products.length > 0) {
          const firstProduct = index.products[0];

          const availableRecipes = getRecipesForProduct(index, firstProduct);

          setProduct(firstProduct);
          setRecipeId(availableRecipes.length > 0 ? availableRecipes[0] : null);

          setProductSources({
            [firstProduct]: {
              type: "produce",
              recipeId:
                availableRecipes.length > 0 ? availableRecipes[0] : null,
            },
          });
        }
      } catch (error) {
        console.error("Failed to load production planner data:", error);

        if (!cancelled) {
          setLoadError(error?.message || "Failed to load production data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProductionData();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleProductChange(newProduct) {
    setProduct(newProduct);

    if (!newProduct || !recipeIndex) {
      setRecipeId(null);
      return;
    }

    const availableRecipes = getRecipesForProduct(recipeIndex, newProduct);

    const firstRecipe =
      availableRecipes.length > 0 ? availableRecipes[0] : null;

    setRecipeId(firstRecipe);

    setProductSources((previous) => ({
      ...previous,

      [newProduct]: {
        type: "produce",
        recipeId: firstRecipe,
      },
    }));

    /*
     * Changing the target invalidates the previous
     * calculated production graph.
     */
    setCalculation(null);

    setGraph({
      nodes: [],
      edges: [],
    });
  }

  function handleRecipeChange(newRecipe) {
    setRecipeId(newRecipe);

    if (!product) {
      return;
    }

    setProductSources((previous) => ({
      ...previous,

      [product]: {
        type: "produce",
        recipeId: newRecipe,
      },
    }));

    setCalculation(null);

    setGraph({
      nodes: [],
      edges: [],
    });
  }

  function handleSourceChange(productName, source) {
    /*
     * Labour cannot be purchased when it is the
     * target product.
     */
    if (productName === "labour" && source.type === "buy") {
      return;
    }

    setProductSources((previous) => ({
      ...previous,

      [productName]: {
        ...source,
      },
    }));
  }

  function calculate() {
    if (!product) {
      return;
    }

    if (!amount || amount <= 0) {
      return;
    }

    if (!recipeIndex) {
      return;
    }

    const source = productSources[product];

    /*
     * For the target product, use the explicitly selected
     * recipe first.
     */
    const selectedRecipe = source?.recipeId || recipeId;

    try {
      const result = calculateProduction(recipes, recipeIndex, {
        product,
        amount,
        recipeId: selectedRecipe,
        productSources,
      });

      const newGraph = buildProductionGraph(recipes, result);

      setCalculation(result);
      setGraph(newGraph);
    } catch (error) {
      console.error("Failed to calculate production:", error);

      setCalculation({
        target: {
          product,
          amount,
        },
        recipes: {},
        products: {},
        purchases: {},
        rawInputs: {},
        surplus: {},
        errors: [
          {
            type: "calculation-error",
            message: error?.message || "Failed to calculate production.",
          },
        ],
      });

      setGraph({
        nodes: [],
        edges: [],
      });
    }
  }

  if (loading) {
    return (
      <div className="production-planner">
        <main className="production-main">
          <div className="production-loading">Loading production data...</div>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="production-planner">
        <main className="production-main">
          <div className="error-panel">
            <strong>Failed to load production data</strong>

            <div>{loadError}</div>
          </div>
        </main>
      </div>
    );
  }

  const products = recipeIndex?.products || [];

  return (
    <div className="production-planner">
      <ProductionSidebar
        recipes={recipes}
        recipeIndex={recipeIndex}
        product={product}
        products={products}
        amount={amount}
        recipeId={recipeId}
        productSources={productSources}
        onProductChange={handleProductChange}
        onAmountChange={setAmount}
        onRecipeChange={handleRecipeChange}
        onSourceChange={handleSourceChange}
        onCalculate={calculate}
      />

      <main className="production-main">
        <div className="production-toolbar">
          <div>
            <h1>Production Line Planner</h1>

            <p>
              Plan production chains, choose recipes and manage market
              purchases.
            </p>
          </div>
        </div>

        {calculation?.errors?.length > 0 && (
          <div className="error-panel">
            {calculation.errors.map((error, index) => (
              <div key={index}>
                {error.message || error.product || error.type}
              </div>
            ))}
          </div>
        )}

        <ProductionGraph nodes={graph.nodes} edges={graph.edges} />

        {calculation && <ProductionSummary calculation={calculation} />}
      </main>
    </div>
  );
}

function ProductionSummary({ calculation }) {
  const purchases = Object.entries(calculation.purchases || {});

  const surplus = Object.entries(calculation.surplus || {});

  const recipeCount = Object.keys(calculation.recipes || {}).length;

  return (
    <div className="production-summary">
      <div className="summary-card">
        <span>Target</span>

        <strong>{calculation.target.product}</strong>

        <small>{formatNumber(calculation.target.amount)}</small>
      </div>

      <div className="summary-card">
        <span>Recipes</span>
        <strong>{recipeCount}</strong>
      </div>

      <div className="summary-card">
        <span>Purchases</span>
        <strong>{purchases.length}</strong>
      </div>

      <div className="summary-card">
        <span>Surplus</span>
        <strong>{surplus.length}</strong>
      </div>

      {purchases.length > 0 && (
        <div className="summary-list">
          <h3>Market purchases</h3>

          {purchases.map(([product, purchaseAmount]) => (
            <div className="summary-row" key={product}>
              <span>{product}</span>

              <strong>{formatNumber(purchaseAmount)}</strong>
            </div>
          ))}
        </div>
      )}

      {surplus.length > 0 && (
        <div className="summary-list">
          <h3>Surplus</h3>

          {surplus.map(([product, surplusAmount]) => (
            <div className="summary-row" key={product}>
              <span>{product}</span>

              <strong>{formatNumber(surplusAmount)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }

  return Number(value.toFixed(3)).toLocaleString();
}
