import { useState } from "react";

import recipes from "../../data/recipes.json";

import {
  buildRecipeIndex,
  getRecipesForProduct,
} from "../../services/production/recipeIndex";

import { calculateProduction } from "../../services/production/productionCalculator";

import { buildProductionGraph } from "../../utils/production/graphBuilder";

import ProductionGraph from "../../components/production/ProductionGraph";

import ProductionSidebar from "../../components/production/ProductionSidebar";

import "./ProductionPlanner.css";

export default function ProductionPlanner() {
  const recipeIndex = buildRecipeIndex(recipes);

  const products = recipeIndex.products.sort();

  const [product, setProduct] = useState(products[0] || "");

  const [amount, setAmount] = useState(1);

  const [recipeId, setRecipeId] = useState(null);

  const [productSources, setProductSources] = useState({});

  const [calculation, setCalculation] = useState(null);

  const [graph, setGraph] = useState({
    nodes: [],
    edges: [],
  });

  function handleProductChange(newProduct) {
    setProduct(newProduct);

    const availableRecipes = getRecipesForProduct(recipeIndex, newProduct);

    setRecipeId(availableRecipes[0] || null);

    setProductSources((previous) => ({
      ...previous,

      [newProduct]: {
        type: "produce",
        recipeId: availableRecipes[0] || null,
      },
    }));
  }

  function handleRecipeChange(newRecipe) {
    setRecipeId(newRecipe);

    setProductSources((previous) => ({
      ...previous,

      [product]: {
        type: "produce",
        recipeId: newRecipe,
      },
    }));
  }

  function handleSourceChange(productName, source) {
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

    const source = productSources[product];

    const selectedRecipe = source?.recipeId || recipeId;

    const result = calculateProduction(recipes, recipeIndex, {
      product,
      amount,
      recipeId: selectedRecipe,
      productSources,
    });

    const newGraph = buildProductionGraph(recipes, result);

    setCalculation(result);

    setGraph(newGraph);
  }

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
  const purchases = Object.entries(calculation.purchases);

  const surplus = Object.entries(calculation.surplus);

  const recipeCount = Object.keys(calculation.recipes).length;

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

          {purchases.map(([product, amount]) => (
            <div className="summary-row" key={product}>
              <span>{product}</span>

              <strong>{formatNumber(amount)}</strong>
            </div>
          ))}
        </div>
      )}

      {surplus.length > 0 && (
        <div className="summary-list">
          <h3>Surplus</h3>

          {surplus.map(([product, amount]) => (
            <div className="summary-row" key={product}>
              <span>{product}</span>

              <strong>{formatNumber(amount)}</strong>
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
