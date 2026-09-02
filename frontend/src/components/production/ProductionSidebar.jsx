import {
  getRecipesForProduct,
  getProducts,
} from "../../services/production/recipeIndex";

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
  products = getProducts(recipeIndex);

  const source = productSources[product] || {
    type: "produce",
  };

  const canBuy = product === "labour" ? false : true;

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
              className={source.type === "produce" ? "active" : ""}
              onClick={() =>
                onSourceChange(product, {
                  type: "produce",
                })
              }
            >
              Produce
            </button>

            {canBuy && (
              <button
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

      {product === "labour" && (
        <div className="info-box">
          <strong>Labour</strong>

          <p>
            Labour can only be purchased when it is required as an input of
            another recipe. When Labour is the target product, you can choose
            one of its production recipes.
          </p>
        </div>
      )}

      <button className="calculate-button" onClick={onCalculate}>
        Calculate production
      </button>
    </aside>
  );
}
