export default function RecipeSelector({
  product,
  recipeIds = [],
  recipes,
  selectedRecipe,
  onChange,
}) {
  return (
    <div className="recipe-selector">
      <label htmlFor="production-recipe">Recipe</label>

      <select
        id="production-recipe"
        value={selectedRecipe || ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Select a recipe</option>

        {recipeIds.map((recipeId) => {
          const recipe = recipes?.[recipeId];

          return (
            <option key={recipeId} value={recipeId}>
              {recipe?.name || recipeId}
            </option>
          );
        })}
      </select>

      {product && (
        <span className="field-hint">
          Recipe executions are calculated in 0.10 increments.
        </span>
      )}
    </div>
  );
}
