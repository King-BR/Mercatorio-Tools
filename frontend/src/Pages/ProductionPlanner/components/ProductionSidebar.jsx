import { getRecipesForProduct } from "../../../services/production/recipeIndex";

import RecipeSelector from "./RecipeSelector";
import ProductSelector from "./ProductSelector";

export default function ProductionSidebar({
  recipes,
  recipeIndex,
  product,
  products,
  amount,
  recipeId,
  productSources,
  onProductChange,
  onAmountChange,
  onRecipeChange,
  onSourceChange,
  onCalculate,
}) {
  const recipeIds = product ? getRecipesForProduct(recipeIndex, product) : [];

  const source = productSources?.[product] || {
    type: "produce",
  };

  /*
   * Labour can never be bought when it is the
   * target product.
   */
  const canBuy = product !== "labour";

  return (
    <aside className="production-sidebar">
      <div className="sidebar-section">
        <h2>Production Line</h2>

        <p className="sidebar-description">
          Choose what you want to produce and the required quantity.
        </p>
      </div>

      <div className="sidebar-section">
        <ProductSelector
          products={products}
          selectedProduct={product}
          onChange={onProductChange}
        />
      </div>

      <div className="sidebar-section">
        <label>Quantity</label>

        <input
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(event) => onAmountChange(Number(event.target.value))}
        />
      </div>

      {product && (
        <div className="sidebar-section">
          <label>Source</label>

          <div className="source-options">
            <button
              type="button"
              className={source.type === "produce" ? "active" : ""}
              onClick={() =>
                onSourceChange(product, {
                  type: "produce",
                  recipeId,
                })
              }
            >
              Produce
            </button>

            {canBuy && (
              <button
                type="button"
                className={source.type === "buy" ? "active" : ""}
                onClick={() =>
                  onSourceChange(product, {
                    type: "buy",
                  })
                }
              >
                Buy
              </button>
            )}
          </div>
        </div>
      )}

      {product && source.type === "produce" && recipeIds.length > 0 && (
        <div className="sidebar-section">
          <RecipeSelector
            product={product}
            recipeIds={recipeIds}
            recipes={recipes}
            selectedRecipe={recipeId}
            onChange={onRecipeChange}
          />
        </div>
      )}

      {product && source.type === "produce" && recipeIds.length === 0 && (
        <div className="info-box">
          <strong>No production recipe</strong>

          <p>
            This product does not currently have a production recipe available.
          </p>
        </div>
      )}

      {product === "labour" && (
        <div className="info-box">
          <strong>Labour</strong>

          <p>
            Labour can only be purchased when it is required as an input of
            another recipe. When Labour is the target product, you must produce
            it.
          </p>
        </div>
      )}

      <button
        type="button"
        className="calculate-button"
        onClick={onCalculate}
        disabled={!product || !amount || amount <= 0}
      >
        Calculate production
      </button>
    </aside>
  );
}
