export default function ProductSelector({
  products = [],
  selectedProduct,
  onChange,
}) {
  return (
    <div className="product-selector">
      <label htmlFor="target-product">Target product</label>

      <select
        id="target-product"
        value={selectedProduct || ""}
        onChange={(event) => onChange(event.target.value || "")}
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
