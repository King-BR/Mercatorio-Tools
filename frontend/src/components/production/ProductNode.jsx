import { Handle, Position } from "@xyflow/react";

export default function ProductNode({ data }) {
  const isBuy = data.source === "buy";

  const isRaw = data.source === "raw";

  return (
    <div
      className={`production-node product-node ${isBuy ? "product-buy" : ""} ${
        isRaw ? "product-raw" : ""
      }`}
    >
      {/* Entrada:
                Recipe -> Product
            */}
      <Handle type="target" position={Position.Left} id="input" />

      <div className="node-header">
        <div className="node-title">{data.product}</div>

        <div
          className={`source-badge ${
            isBuy ? "buy" : isRaw ? "raw" : "produce"
          }`}
        >
          {isBuy ? "MARKET" : isRaw ? "RAW" : "PRODUCE"}
        </div>
      </div>

      <div className="node-value">
        <span>Required:</span>

        <strong>{formatNumber(data.required)}</strong>
      </div>

      {isBuy && (
        <div className="node-subvalue">
          Purchased: {formatNumber(data.purchased)}
        </div>
      )}

      {!isBuy && data.produced > 0 && (
        <div className="node-subvalue">
          Produced: {formatNumber(data.produced)}
        </div>
      )}

      {/* Saída:
                Product -> Recipe
            */}
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
}

function formatNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }

  return Number(value.toFixed(3)).toLocaleString();
}
