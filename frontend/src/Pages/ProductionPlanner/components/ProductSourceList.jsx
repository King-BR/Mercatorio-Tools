import { getRecipesForProduct } from "../../../services/production/recipeIndex";

export default function ProductSourceList({
  products = [],
  recipeIndex,
  productSources = {},
  targetProduct,
  onSourceChange,
  onRecipeChange,
}) {
  if (!products.length) {
    return null;
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

          if (isLabour && !isTarget) {
            return null;
          }

          const canProduce = recipes.length > 0 || isLabour;

          const canBuy = !isLabour || !isTarget;

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
                  Purchased from market
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
