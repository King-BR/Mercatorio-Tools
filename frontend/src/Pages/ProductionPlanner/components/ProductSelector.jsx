export default function ProductSelector({
  products = [],
  selectedProduct,
  onChange,
}) {
  return (
    <div className="recipe-selector">
      <label htmlFor="production-target-product">Target Product</label>

      <select
        id="production-target-product"
        value={selectedProduct || ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Select a product</option>

        {products.map((product) => (
          <option key={product} value={product}>
            {product}
          </option>
        ))}
      </select>
    </div>
  );
}
