import { getRecipesForProduct } from "../../../services/production/recipeIndex";

import ProductSelector from "./ProductSelector";
import RecipeSelector from "./RecipeSelector";

export default function ProductionSidebar({
  products = [],
  recipeIndex,
  product,
  amount,
  recipeId,
  productSources,
  onProductChange,
  onAmountChange,
  onRecipeChange,
  onCalculate,
}) {
  const recipeIds = product ? getRecipesForProduct(recipeIndex, product) : [];

  const source = productSources?.[product] || {
    type: "produce",
    recipeId: recipeIds[0] || null,
  };

  const isLabour = product === "labour";

  return (
    <aside className="production-sidebar">
      <div className="sidebar-section">
        <h2>Production Line</h2>

        <p className="sidebar-description">
          Choose the target product, quantity and how each product in the
          production chain should be obtained.
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
        <label htmlFor="production-amount">Target quantity</label>

        <input
          id="production-amount"
          type="number"
          min="0.001"
          step="0.001"
          value={amount}
          onChange={(event) => onAmountChange(Number(event.target.value))}
        />

        <span className="field-hint">
          Product quantities can use up to 3 decimal places.
        </span>
      </div>

      {product && source.type === "produce" && recipeIds.length > 0 && (
        <div className="sidebar-section">
          <RecipeSelector
            product={product}
            recipeIds={recipeIds}
            recipes={recipeIndex?.recipeMap}
            selectedRecipe={recipeId}
            onChange={onRecipeChange}
          />
        </div>
      )}

      {product && recipeIds.length === 0 && source.type === "produce" && (
        <div className="info-box">
          <strong>No recipe available</strong>

          <p>This product cannot be produced with the available recipes.</p>
        </div>
      )}

      {isLabour && (
        <div className="info-box">
          <strong>Labour</strong>

          <p>
            Labour is automatically purchased when required as an input. It can
            only be produced when Labour itself is the target.
          </p>
        </div>
      )}

      <div className="rules-box">
        <strong>Game limitations</strong>

        <ul>
          <li>Recipe runs use 0.10 increments.</li>

          <li>Market purchases are whole units.</li>

          <li>Recipe inputs support up to 3 decimal places.</li>
        </ul>
      </div>

      <button
        type="button"
        className="calculate-button"
        disabled={!product || !amount || amount <= 0}
        onClick={onCalculate}
      >
        Calculate production
      </button>
    </aside>
  );
}
