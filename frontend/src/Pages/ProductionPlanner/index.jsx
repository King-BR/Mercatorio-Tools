import { useEffect, useMemo, useState } from "react";

import {
  buildRecipeIndex,
  getRecipesForProduct,
} from "../../services/production/recipeIndex";

import { calculateProduction } from "../../services/production/productionCalculator";

import { buildProductionGraph } from "../../utils/production/graphBuilder";

import ProductionGraph from "./components/ProductionGraph";
import ProductionSidebar from "./components/ProductionSidebar";
import ProductSourceList from "./components/ProductSourceList";
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

  const productionProducts = useMemo(() => {
    const result = new Set();

    if (product) {
      result.add(product);
    }

    for (const productName of Object.keys(productSources)) {
      result.add(productName);
    }

    if (calculation?.products) {
      for (const productName of Object.keys(calculation.products)) {
        result.add(productName);
      }
    }

    return Array.from(result);
  }, [product, productSources, calculation]);

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

        /*
         * Default source is BUY.
         *
         * The recipe is still stored so that if the user
         * changes to Produce, we already have a recipe
         * available.
         */
        setProductSources(
          firstProduct
            ? {
                [firstProduct]: {
                  type: "buy",
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

    /*
     * New target starts as BUY.
     */
    setProductSources(
      newProduct
        ? {
            [newProduct]: {
              type: "buy",
              recipeId: firstRecipe,
            },
          }
        : {},
    );

    /*
     * IMPORTANT:
     * Do NOT clear calculation or graph here.
     *
     * The graph only changes when Calculate Production
     * is pressed.
     */
  }

  function handleRecipeChange(productName, newRecipeId) {
    if (!productName) {
      return;
    }

    if (productName === product) {
      setRecipeId(newRecipeId);
    }

    setProductSources((current) => ({
      ...current,
      [productName]: {
        ...current[productName],
        type: "produce",
        recipeId: newRecipeId,
      },
    }));

    /*
     * Do not recalculate here.
     *
     * The new recipe is only applied to the graph after
     * Calculate Production is pressed.
     */
  }

  function handleSourceChange(productName, source) {
    /*
     * Labour can only be bought when it is an input.
     * If labour is the target product, it cannot be bought.
     */
    if (
      productName === "labour" &&
      source.type === "buy" &&
      productName === product
    ) {
      return;
    }

    setProductSources((current) => ({
      ...current,
      [productName]: {
        ...current[productName],
        ...source,
      },
    }));

    /*
     * Keep the target recipe synchronized.
     */
    if (productName === product && source.type === "produce") {
      const availableRecipes = getRecipesForProduct(recipeIndex, product);

      const selectedRecipe =
        source.recipeId || recipeId || availableRecipes[0] || null;

      setRecipeId(selectedRecipe);

      /*
       * Make sure the source also has the selected recipe.
       */
      setProductSources((current) => ({
        ...current,
        [productName]: {
          ...current[productName],
          type: "produce",
          recipeId: selectedRecipe,
        },
      }));
    }

    if (productName === product && source.type === "buy") {
      setRecipeId(null);
    }

    /*
     * IMPORTANT:
     * No calculation/graph update here.
     */
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

    /*
     * If target is BUY, there is no recipe.
     *
     * If target is PRODUCE, use the selected recipe.
     */
    const selectedRecipe =
      targetSource?.type === "buy"
        ? null
        : targetSource?.recipeId || recipeId || null;

    const result = calculateProduction(recipeIndex.recipeMap, recipeIndex, {
      product,
      amount: numericAmount,
      recipeId: selectedRecipe,
      productSources,
    });

    const newGraph = buildProductionGraph(recipeIndex.recipeMap, result);

    /*
     * THIS is the only place where the graph is rebuilt.
     */
    setCalculation(result);
    setGraph(newGraph);

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
        onRecipeChange={(newRecipeId) =>
          handleRecipeChange(product, newRecipeId)
        }
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

        {productionProducts.length > 0 && (
          <ProductSourceList
            products={productionProducts}
            recipeIndex={recipeIndex}
            productSources={productSources}
            targetProduct={product}
            onSourceChange={handleSourceChange}
            onRecipeChange={handleRecipeChange}
          />
        )}

        {calculation && <ProductionSummary calculation={calculation} />}
      </main>
    </div>
  );
}
