import { useEffect, useMemo, useState } from "react";

import {
  buildRecipeIndex,
  getRecipesForProduct,
} from "../../services/production/recipeIndex";

import { calculateProduction } from "../../services/production/productionCalculator";

import { buildProductionGraph } from "../../utils/production/graphBuilder";

import ProductionGraph from "./components/ProductionGraph";
import ProductionSidebar from "./components/ProductionSidebar";
import ProductionSummary from "./components/ProductionSummary";

import "./ProductionPlanner.css";

export default function ProductionPlanner() {
  const [recipeIndex, setRecipeIndex] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [product, setProduct] = useState("");

  const [amount, setAmount] = useState(1);

  const [recipeId, setRecipeId] = useState(null);

  const [productSources, setProductSources] = useState({});

  const [calculation, setCalculation] = useState(null);

  const [graph, setGraph] = useState({
    nodes: [],
    edges: [],
  });

  const [layoutVersion, setLayoutVersion] = useState(0);

  const products = useMemo(() => recipeIndex?.products || [], [recipeIndex]);

  /*
   * Load recipes/products once.
   */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const index = await buildRecipeIndex();

        if (cancelled) {
          return;
        }

        setRecipeIndex(index);

        const firstProduct = index.products?.[0] || "";

        setProduct(firstProduct);

        const recipesForProduct = getRecipesForProduct(index, firstProduct);

        const firstRecipe = recipesForProduct[0] || null;

        setRecipeId(firstRecipe);

        setProductSources(
          firstProduct
            ? {
                [firstProduct]: {
                  type: "produce",
                  recipeId: firstRecipe,
                },
              }
            : {},
        );
      } catch (err) {
        console.error("Failed to load production planner data:", err);

        if (!cancelled) {
          setError("Failed to load production planner data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleProductChange(newProduct) {
    setProduct(newProduct);

    const availableRecipes = getRecipesForProduct(recipeIndex, newProduct);

    const firstRecipe = availableRecipes[0] || null;

    setRecipeId(firstRecipe);

    setProductSources(
      newProduct
        ? {
            [newProduct]: {
              type: "produce",
              recipeId: firstRecipe,
            },
          }
        : {},
    );

    /*
     * A previous calculation no longer represents
     * the selected target.
     */
    setCalculation(null);

    setGraph({
      nodes: [],
      edges: [],
    });
  }

  function handleRecipeChange(newRecipeId) {
    setRecipeId(newRecipeId);

    if (!product) {
      return;
    }

    setProductSources((current) => ({
      ...current,

      [product]: {
        type: "produce",
        recipeId: newRecipeId,
      },
    }));
  }

  function handleSourceChange(productName, source) {
    /*
     * Labour can never be configured as a
     * purchased target. As an input, the
     * calculator automatically buys it.
     */
    if (productName === "labour" && source.type === "buy") {
      return;
    }

    setProductSources((current) => ({
      ...current,

      [productName]: {
        ...current[productName],

        ...source,
      },
    }));
  }

  function handleCalculate() {
    if (!recipeIndex || !product) {
      return;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    const targetSource = productSources[product];

    const selectedRecipe = targetSource?.recipeId || recipeId || null;

    const result = calculateProduction(recipeIndex.recipeMap, recipeIndex, {
      product,
      amount: numericAmount,
      recipeId: selectedRecipe,
      productSources,
    });

    const newGraph = buildProductionGraph(recipeIndex.recipeMap, result);

    setCalculation(result);
    setGraph(newGraph);

    /*
     * Force the graph to auto-layout even
     * if this is the exact same calculation.
     */
    setLayoutVersion((current) => current + 1);
  }

  if (loading) {
    return (
      <div className="production-planner-state">Loading production data...</div>
    );
  }

  if (error) {
    return <div className="production-planner-state error">{error}</div>;
  }

  return (
    <div className="production-planner">
      <ProductionSidebar
        products={products}
        recipeIndex={recipeIndex}
        product={product}
        amount={amount}
        recipeId={recipeId}
        productSources={productSources}
        onProductChange={handleProductChange}
        onAmountChange={setAmount}
        onRecipeChange={handleRecipeChange}
        onSourceChange={handleSourceChange}
        onCalculate={handleCalculate}
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
          <div className="production-errors">
            {calculation.errors.map((item, index) => (
              <div key={`${item.type}-${index}`}>{item.message}</div>
            ))}
          </div>
        )}

        <div className="production-graph-container">
          {graph.nodes.length > 0 ? (
            <ProductionGraph
              nodes={graph.nodes}
              edges={graph.edges}
              layoutVersion={layoutVersion}
            />
          ) : (
            <div className="production-empty">
              <strong>No production line</strong>

              <span>
                Configure the target and calculate the production line.
              </span>
            </div>
          )}
        </div>

        {calculation && <ProductionSummary calculation={calculation} />}
      </main>
    </div>
  );
}
