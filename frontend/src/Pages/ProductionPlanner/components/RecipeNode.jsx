import { Handle, Position } from "@xyflow/react";

function formatAmount(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toFixed(3).replace(/\.?0+$/, "");
}

export default function RecipeNode({ data }) {
  const { name, runs = 0, inputs = {}, outputs = {} } = data || {};

  return (
    <div
      style={{
        minWidth: 220,
        maxWidth: 280,
        padding: "12px 14px",
        borderRadius: 10,
        background: "#16283b",
        border: "1px solid #36536e",
        color: "#e8f0f8",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
      }}
    >
      {/* Inputs */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          width: 9,
          height: 9,
          background: "#8da8c2",
          border: "2px solid #16283b",
        }}
      />

      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 8,
          wordBreak: "break-word",
        }}
      >
        {name}
      </div>

      <div
        style={{
          display: "inline-flex",
          padding: "3px 7px",
          borderRadius: 5,
          background: "rgba(255, 255, 255, 0.07)",
          color: "#aebed0",
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        {formatAmount(runs)} runs
      </div>

      {Object.keys(inputs).length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            fontSize: 11,
            color: "#aebed0",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#7189a0",
              marginBottom: 2,
            }}
          >
            Inputs
          </div>

          {Object.entries(inputs).map(([product, amount]) => (
            <div
              key={product}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <span>{product}</span>
              <strong style={{ color: "#d3dfeb" }}>
                {formatAmount(amount)}
              </strong>
            </div>
          ))}
        </div>
      )}

      {Object.keys(outputs).length > 0 && (
        <div
          style={{
            marginTop: 9,
            paddingTop: 8,
            borderTop: "1px solid #294258",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            fontSize: 11,
            color: "#aebed0",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#7189a0",
              marginBottom: 2,
            }}
          >
            Outputs
          </div>

          {Object.entries(outputs).map(([product, amount]) => (
            <div
              key={product}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <span>{product}</span>
              <strong style={{ color: "#8bd8a8" }}>
                {formatAmount(amount)}
              </strong>
            </div>
          ))}
        </div>
      )}

      {/* Outputs */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          width: 9,
          height: 9,
          background: "#8bd8a8",
          border: "2px solid #16283b",
        }}
      />
    </div>
  );
}
