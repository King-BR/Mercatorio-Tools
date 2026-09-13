export default function TownSelector({ selectedTown, towns = [], onChange }) {
  return (
    <div className="town-selector">
      <label htmlFor="production-town">Town</label>

      <select
        id="production-town"
        value={selectedTown || ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Select a town</option>

        {towns.map((town) => (
          <option key={town} value={town}>
            {town}
          </option>
        ))}
      </select>
    </div>
  );
}
