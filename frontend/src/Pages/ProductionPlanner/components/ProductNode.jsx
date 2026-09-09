import { Handle, Position } from "@xyflow/react";

function formatAmount(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toFixed(3).replace(/\.?0+$/, "");
}

function formatCost(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toFixed(3).replace(/\.?0+$/, "");
}

export default function ProductNode({ data }) {
  const {
    product,
    required = 0,
    produced = 0,
    purchased = 0,
    surplus = 0,
    source,
    unitCost,
    marketPrice,
  } = data || {};

  const sourceType = source?.type || (purchased > 0 ? "buy" : "produce");

  const isBuy = sourceType === "buy";

  return (
    <div
      style={{
        minWidth: 220,
        maxWidth: 280,
        padding: "12px 14px",
        borderRadius: 10,
        background: "#0d1b2a",
        border: "1px solid #28445f",
        color: "#e8f0f8",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
      }}
    >
      {/* Input from recipe */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          width: 9,
          height: 9,
          background: "#6f8ba6",
          border: "2px solid #0d1b2a",
        }}
      />

      {/* Product name */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 8,
          wordBreak: "break-word",
        }}
      >
        {product}
      </div>

      {/* Source */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 7px",
          marginBottom: 10,
          borderRadius: 5,
          background: isBuy
            ? "rgba(91, 155, 213, 0.15)"
            : "rgba(78, 180, 120, 0.15)",
          color: isBuy ? "#8fc7f5" : "#8bd8a8",
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {isBuy ? "Market" : "Produce"}
      </div>

      {/* Quantities */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          fontSize: 12,
          color: "#aebed0",
        }}
      >
        {required > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span>Required</span>

            <strong style={{ color: "#e8f0f8" }}>
              {formatAmount(required)}
            </strong>
          </div>
        )}

        {produced > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span>Produced</span>

            <strong style={{ color: "#8bd8a8" }}>
              {formatAmount(produced)}
            </strong>
          </div>
        )}

        {purchased > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span>Purchased</span>

            <strong style={{ color: "#8fc7f5" }}>
              {formatAmount(purchased)}
            </strong>
          </div>
        )}

        {surplus > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              marginTop: 3,
              paddingTop: 5,
              borderTop: "1px solid #24384c",
            }}
          >
            <span>Surplus</span>

            <strong style={{ color: "#e4c77b" }}>
              {formatAmount(surplus)}
            </strong>
          </div>
        )}
      </div>

      {/* Cost information */}
      {(unitCost != null || marketPrice != null) && (
        <div
          style={{
            marginTop: 9,
            paddingTop: 8,
            borderTop: "1px solid #24384c",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 11,
            color: "#8195aa",
          }}
        >
          {marketPrice != null && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span>Market price</span>

              <strong style={{ color: "#b8c8d8" }}>
                {formatCost(marketPrice)}
              </strong>
            </div>
          )}

          {unitCost != null && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span>Unit cost</span>

              <strong style={{ color: "#e8f0f8" }}>
                {formatCost(unitCost)}
              </strong>
            </div>
          )}
        </div>
      )}

      {/* Output to recipe */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          width: 9,
          height: 9,
          background: "#6f8ba6",
          border: "2px solid #0d1b2a",
        }}
      />
    </div>
  );
}
