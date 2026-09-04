export default function RecipeSelector({
  product,
  recipeIds,
  recipes,
  selectedRecipe,
  onChange,
}) {
  return (
    <div className="recipe-selector">
      <label>Recipe for {product}</label>

      <select
        value={selectedRecipe || ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Select a recipe</option>

        {recipeIds.map((recipeId) => (
          <option key={recipeId} value={recipeId}>
            {recipes[recipeId]?.name || recipeId}
          </option>
        ))}
      </select>
    </div>
  );
}
