export default function PriceFromSelector({ priceFrom, onChange, user }) {
  return (
    <div className="price-from-selector">
      <label htmlFor="production-price-from">Use prices from</label>

      <select
        id="production-price-from"
        value={priceFrom || ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="player" disabled={user != null ? false : true}>
          Player Inventory (fallback to market)
        </option>
        <option value="market">Market</option>
      </select>
    </div>
  );
}
