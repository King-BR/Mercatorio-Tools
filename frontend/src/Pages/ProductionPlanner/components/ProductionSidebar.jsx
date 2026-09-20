import { getRecipesForProduct } from "../../../services/production/recipeIndex";

import logger from "../../../utils/logger";

import PriceFromSelector from "./PriceFromSelector";
import ProductSelector from "../../../components/ProductSelector";
import RecipeSelector from "../../../components/RecipeSelector";
import TownSelector from "../../../components/TownSelector";

export default function ProductionSidebar({
  recipeIndex,
  product,
  amount,
  recipeId,
  productSources,
  selectedTown,
  priceFrom,
  user,
  hasMercatorioApiKey,
  onProductChange,
  onAmountChange,
  onRecipeChange,
  onCalculate,
  onTownChange,
  onPriceFromChange,
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
        <ProductSelector selectedProduct={product} onChange={onProductChange} />
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
        <div className="sidebar-section noBorder">
          <RecipeSelector
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

      <br />
      <br />

      {user === null && (
        <div className="info-box">
          <span>You are not logged in</span>

          <p>
            To import your inventory prices, you need to be logged in and have a
            valid mercatorio api key registered.
          </p>
        </div>
      )}

      {logger.log(user)}

      {user !== null && !hasMercatorioApiKey && (
        <div className="info-box">
          <span>No mercatorio API key</span>

          <p>
            To import your inventory prices, you need to have a valid mercatorio
            api key registered. Get one{" "}
            <a
              href="https://play.mercatorio.io/settings/api"
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </a>{" "}
            and register it{" "}
            <a href="/account" target="_blank" rel="noopener noreferrer">
              here
            </a>
            .
          </p>
        </div>
      )}

      <div className="sidebar-section">
        <PriceFromSelector
          priceFrom={priceFrom}
          onChange={onPriceFromChange}
          user={user}
        />
      </div>

      <div className="sidebar-section">
        <TownSelector selectedTown={selectedTown} onChange={onTownChange} />
      </div>
    </aside>
  );
}
