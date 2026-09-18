import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../../context/AuthContext";

import {
  buildRecipeIndex,
  getRecipesForProduct,
} from "../../services/production/recipeIndex";

import { calculateProduction } from "../../services/production/productionCalculator";

import { buildProductionGraph } from "../../utils/production/graphBuilder";

import {
  getMarketData,
  getPlayerInventory,
  getBuildings,
} from "../../services/api";

import logger from "../../utils/logger";

import ProductionGraph from "./components/ProductionGraph";
import ProductionSidebar from "./components/ProductionSidebar";
import ProductSourceList from "./components/ProductSourceList";
import ProductionSummary from "./components/ProductionSummary";

import "./ProductionPlanner.css";
import TopNavbar from "../../components/TopNavbar/TopNavbar";

export default function ProductionPlanner() {
  const { user, hasMercatorioApiKey } = useAuth();

  const [userInventory, setUserInventory] = useState(null);
  const [priceFrom, setPriceFrom] = useState("market");

  const [marketData, setMarketData] = useState(null);

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

  const [selectedTown, setSelectedTown] = useState(null);

  const [productPrices, setProductPrices] = useState(new Map());

  const [productCustomPrices, setProductCustomPrices] = useState(new Map());

  const [towns, setTowns] = useState([]);

  const productionGraphRef = useRef(null);

  const products = useMemo(() => recipeIndex?.products || [], [recipeIndex]);

  const productionProducts = useMemo(() => {
    const result = new Set();

    if (product) {
      result.add(product);
    }

    if (calculation?.products) {
      for (const productName of Object.keys(calculation.products)) {
        result.add(productName);
      }
    }

    return Array.from(result);
  }, [product, productSources, calculation]);

  const [buildingsData, setBuildingsData] = useState(new Map());
  const [upgradesChainByBuilding, setUpgradesChainByBuilding] = useState(
    new Map(),
  );

  useEffect(() => {
    getBuildings().then((data) => {
      setBuildingsData((current) => {
        current.clear();
        data.forEach((b) => current.set(b.type, b));
        return current;
      });

      setUpgradesChainByBuilding((current) => {
        current.clear();

        data.forEach((b) => {
          b.upgrades?.forEach((upgrade) => {
            if (!current.has(b.type)) {
              current.set(b.type, new Map());
            }

            current.get(b.type).set(upgrade.type, upgrade.requires || null);
          });
        });
        return current;
      });
    });
  }, []);

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

        const marketDataResponse = await getMarketData();

        setMarketData(marketDataResponse);
        setTowns(marketDataResponse.map((market) => market.name));
        setSelectedTown(marketDataResponse[0].name);

        Object.entries(marketDataResponse[0].markets).forEach(
          ([product, data]) => {
            productPrices.set(
              product,
              Number.parseFloat(data.price).toFixed(2) || 0,
            );
          },
        );

        logger.log("Product market prices:", productPrices);

        setRecipeIndex(index);

        const inventory = await getPlayerInventory(user);
        setUserInventory(inventory.storage?.inventory ?? null);

        const firstProduct = index.products?.[0] || "";

        setProduct(firstProduct);

        const recipesForProduct = getRecipesForProduct(index, firstProduct);

        const firstRecipe = recipesForProduct[0] || null;

        setRecipeId(firstRecipe);

        /*
         * The target product must always start
         * as PRODUCE.
         */
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

    /*
     * The selected target product must always
     * be PRODUCE.
     */
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
     * The graph is intentionally NOT rebuilt here.
     */
  }

  function handleTownChange(newTown) {
    setSelectedTown(newTown);

    Object.entries(
      marketData.find((market) => market.name === newTown).markets,
    ).forEach(([product, data]) => {
      productPrices.set(product, Number.parseFloat(data.price).toFixed(2) || 0);
    });
  }

  async function handleImportUserInventory() {
    const inventory = await getPlayerInventory(user);
    setUserInventory(inventory.storage.inventory);
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
     * Do not recalculate or rebuild the graph here.
     */
  }

  function handleSourceChange(productName, source) {
    /*
     * The target product can never be bought.
     */
    if (productName === product && source.type === "buy") {
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
     * Keep the target recipe synchronized when
     * switching the target to PRODUCE.
     */
    if (productName === product && source.type === "produce") {
      const availableRecipes = getRecipesForProduct(recipeIndex, product);

      const selectedRecipe =
        source.recipeId || recipeId || availableRecipes[0] || null;

      setRecipeId(selectedRecipe);

      setProductSources((current) => ({
        ...current,
        [productName]: {
          ...current[productName],
          type: "produce",
          recipeId: selectedRecipe,
        },
      }));
    }

    /*
     * Do not recalculate or rebuild the graph here.
     */
  }

  function handlePriceChange(productName, newPrice) {
    if (newPrice === null) {
      setProductCustomPrices((current) => {
        const updated = new Map(current);
        updated.delete(productName);
        return updated;
      });
      return;
    }

    setProductCustomPrices((current) => {
      const updated = new Map(current);
      updated.set(productName, newPrice);
      return updated;
    });
  }

  function handlePriceFromChange(newPriceFrom) {
    setPriceFrom(newPriceFrom);
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
     * The target should always be PRODUCE.
     */
    const selectedRecipe =
      targetSource?.type === "produce"
        ? targetSource.recipeId ||
          recipeId ||
          getRecipesForProduct(recipeIndex, product)[0] ||
          null
        : recipeId || getRecipesForProduct(recipeIndex, product)[0] || null;

    const result = calculateProduction(recipeIndex.recipeMap, recipeIndex, {
      product,
      amount: numericAmount,
      recipeId: selectedRecipe,
      productSources,
      productPrices,
      productCustomPrices,
      userInventory,
      priceFrom,
    });

    const newGraph = buildProductionGraph(recipeIndex.recipeMap, result);

    /*
     * The graph is rebuilt ONLY here.
     */
    setCalculation(result);
    setGraph(newGraph);

    setLayoutVersion((current) => current + 1);
  }

  function handleResetLayout() {
    productionGraphRef.current?.resetLayout();
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
    <>
      <TopNavbar />
      <div className="production-planner">
        <ProductionSidebar
          products={products}
          recipeIndex={recipeIndex}
          product={product}
          amount={amount}
          recipeId={recipeId}
          productSources={productSources}
          selectedTown={selectedTown}
          towns={towns}
          priceFrom={priceFrom}
          user={user}
          hasMercatorioApiKey={hasMercatorioApiKey}
          onProductChange={handleProductChange}
          onAmountChange={setAmount}
          onRecipeChange={(newRecipeId) =>
            handleRecipeChange(product, newRecipeId)
          }
          onCalculate={handleCalculate}
          onTownChange={handleTownChange}
          onImportUserInventory={handleImportUserInventory}
          onPriceFromChange={handlePriceFromChange}
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

          <div className="production-graph-header">
            {calculation?.errors?.length > 0 && (
              <div className="production-errors">
                {calculation.errors.some(
                  (item) => item.type === "circular-dependency",
                ) && (
                  <div key="error-circular-dependency">
                    Circular dependency detected for:{" "}
                    {[
                      ...new Set(
                        calculation.errors
                          .filter((item) => item.type === "circular-dependency")
                          .map((item) => item.product),
                      ),
                    ].join(", ")}
                  </div>
                )}
                {[
                  ...new Set(
                    calculation.errors.map((item) => {
                      if (item.type !== "circular-dependency") return item;
                      return null;
                    }),
                  ),
                ]
                  .filter((item) => item !== undefined && item !== null)
                  .map((item, index) => (
                    <div key={`error-${index}`}>{item.message}</div>
                  ))}
              </div>
            )}

            <button
              type="button"
              className="production-reset-layout-button"
              onClick={handleResetLayout}
              disabled={graph.nodes.length === 0}
            >
              Reset Layout
            </button>
          </div>

          <div className="production-graph-container">
            {graph.nodes.length > 0 ? (
              <ProductionGraph
                ref={productionGraphRef}
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

          {calculation && (
            <ProductionSummary
              calculation={calculation}
              buildingsData={buildingsData}
              upgradesChainByBuilding={upgradesChainByBuilding}
              userInventory={userInventory}
            />
          )}

          {productionProducts.length > 0 && (
            <ProductSourceList
              products={productionProducts}
              recipeIndex={recipeIndex}
              productSources={productSources}
              productPrices={productPrices}
              productCustomPrices={productCustomPrices}
              userInventory={userInventory}
              priceFrom={priceFrom}
              targetProduct={product}
              onSourceChange={handleSourceChange}
              onRecipeChange={handleRecipeChange}
              onPriceChange={handlePriceChange}
            />
          )}
        </main>
      </div>
    </>
  );
}

export const routeConfig = {
  auth: false,
};
