import { getRecipesForProduct } from "../../../services/production/recipeIndex";

const MAX_DECIMALS = 3;
const EPSILON = 1e-9;

function round(value, decimals = MAX_DECIMALS) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** decimals;

  return Math.round((value + EPSILON) * factor) / factor;
}

export default function ProductSourceList({
  products = [],
  recipeIndex,
  productSources = {},
  productPrices = new Map(),
  productCustomPrices = new Map(),
  userInventory,
  priceFrom,
  targetProduct,
  onSourceChange,
  onRecipeChange,
  onPriceChange,
}) {
  if (!products.length) {
    return null;
  }

  function getPrice(product) {
    if (product === "labour" && priceFrom === "player" && !productCustomPrices.has(product)) {
      var purchased = {
        amount:
          Number.parseFloat(userInventory.account.assets[product]?.purchase) ||
          0,
        price:
          Number.parseFloat(
            userInventory.account.assets[product]?.purchase_price,
          ) || 0,
      };

      var produced = {
        amount:
          Number.parseFloat(
            userInventory.previous_flows[product]?.production,
          ) || 0,
        price:
          (Number.parseFloat(
            userInventory.previous_flows[product]?.production_cost,
          ) || 0) /
            Number.parseFloat(
              userInventory.previous_flows[product]?.production,
            ) || 0,
      };

      // weigh the purchased and produced amounts to get an effective price
      const totalAmount = purchased.amount + produced.amount;
      const effectivePrice =
        totalAmount > 0
          ? (purchased.amount * purchased.price +
              produced.amount * produced.price) /
            totalAmount
          : 0;

      return round(effectivePrice, 2);
    }

    return round(
      productCustomPrices.has(product)
        ? productCustomPrices.get(product)
        : priceFrom === "player" &&
            userInventory.account.assets[product]?.unit_cost &&
            Number.parseFloat(
              userInventory.account.assets[product]?.unit_cost,
            ) >= 0
          ? Number.parseFloat(userInventory.account.assets[product]?.unit_cost)
          : productPrices.has(product) &&
              Number.parseFloat(productPrices.get(product)) > 0
            ? Number.parseFloat(productPrices.get(product))
            : Number.parseFloat(
                recipeIndex.productsData?.find((item) => item?.name === product)
                  ?.price?.typical || 0,
              ),
      2,
    );
  }

  return (
    <div className="production-source-list">
      <div className="production-section-title">Production sources</div>

      <div className="production-source-items">
        {products.map((product) => {
          const source = productSources[product] || {
            type: "buy",
            recipeId: null,
          };

          const recipes = recipeIndex
            ? getRecipesForProduct(recipeIndex, product)
            : [];

          const isLabour = product === "labour";
          const isTarget = product === targetProduct;

          const canProduce = !isLabour && !isTarget && recipes.length > 0;

          /*
           * Target products can never be bought.
           *
           * This still allows labour to be bought when
           * labour is an input, because then isTarget
           * is false.
           */
          const canBuy = !isTarget;

          return (
            <div
              key={product}
              className={`production-source-item ${isTarget ? "target" : ""}`}
            >
              <div className="production-source-header">
                <div className="production-source-product">{product}</div>

                {isTarget && (
                  <span className="production-source-target">Target</span>
                )}
              </div>

              <div className="production-source-options">
                <button
                  type="button"
                  className={source.type === "produce" ? "active" : ""}
                  disabled={!canProduce}
                  onClick={() =>
                    onSourceChange(product, {
                      type: "produce",
                      recipeId: source.recipeId || recipes[0] || null,
                    })
                  }
                >
                  Produce
                </button>

                <button
                  type="button"
                  className={source.type === "buy" ? "active" : ""}
                  disabled={!canBuy}
                  onClick={() =>
                    onSourceChange(product, {
                      type: "buy",
                      recipeId: null,
                    })
                  }
                >
                  Buy
                </button>
              </div>

              {source.type === "produce" && (
                <div className="production-source-recipe">
                  <label>Recipe</label>

                  {recipes.length > 0 ? (
                    <select
                      value={source.recipeId || ""}
                      onChange={(event) =>
                        onRecipeChange(product, event.target.value)
                      }
                    >
                      {recipes.map((recipeId) => (
                        <option key={recipeId} value={recipeId}>
                          {recipeId}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="production-source-no-recipe">
                      No production recipe available.
                    </div>
                  )}
                </div>
              )}

              {source.type === "buy" && (
                <div className="production-source-market">
                  {productCustomPrices.has(product) ? (
                    <label>
                      Custom Price{" "}
                      <button
                        type="button"
                        className="production-source-market-reset-price-button"
                        onClick={() => onPriceChange(product, null)}
                      >
                        Reset Price
                      </button>
                    </label>
                  ) : priceFrom === "player" &&
                    userInventory.account.assets[product]?.unit_cost &&
                    userInventory.account.assets[product]?.unit_cost > 0 ? (
                    <label>Price from inventory</label>
                  ) : productPrices.has(product) ? (
                    <label>Market Price</label>
                  ) : (
                    <label>Arbitrary Price</label>
                  )}
                  <input
                    id={`price-${product}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={getPrice(product)}
                    onChange={(event) =>
                      onPriceChange(product, Number(event.target.value))
                    }
                  />
                </div>
              )}

              {isLabour && !canBuy && (
                <div className="production-source-hint">
                  Labour cannot be purchased when it is the final product.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
