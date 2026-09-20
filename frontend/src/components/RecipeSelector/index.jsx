import "./RecipeSelector.css";

export default function RecipeSelector({
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
        <option value="" disabled>Select a recipe</option>

        {recipeIds.map((recipeId) => {
          const recipe = recipes?.[recipeId];

          return (
            <option key={recipeId} value={recipeId}>
              {recipe?.name || recipeId}
            </option>
          );
        })}
      </select>
    </div>
  );
}
