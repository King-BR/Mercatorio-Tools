import { useState, useEffect } from "react";
import { getProducts } from "../../services/api";

import "./ProductSelector.css";

export default function ProductSelector({ selectedProduct, onChange }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data.map((product) => product.name));
      setLoading(false);
    });
  }, []);

  return loading ? (
    <div>Loading products...</div>
  ) : (
    <div className="product-selector">
      <label htmlFor="target-product">Target product</label>

      <select
        id="target-product"
        value={selectedProduct || ""}
        onChange={(event) => onChange(event.target.value || "")}
      >
        <option value="" disabled>Select a product</option>

        {products.map((product) => (
          <option key={product} value={product}>
            {product}
          </option>
        ))}
      </select>
    </div>
  );
}
