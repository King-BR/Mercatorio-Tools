import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import ProductNode from "./ProductNode";

function RecipeNode({ data }) {
  return (
    <div className="production-node recipe-node">
      <Handle type="target" position={Position.Left} id="input" />

      <div className="recipe-node-title">{data.name}</div>

      <div className="recipe-node-runs">Runs: {formatNumber(data.runs)}</div>

      <div className="recipe-node-section">
        <strong>Inputs</strong>

        {Object.entries(data.inputs || {}).map(([product, amount]) => (
          <div key={product} className="recipe-row">
            <span>{product}</span>

            <span>{formatNumber(amount)}</span>
          </div>
        ))}
      </div>

      <div className="recipe-node-section">
        <strong>Outputs</strong>

        {Object.entries(data.outputs || {}).map(([product, amount]) => (
          <div key={product} className="recipe-row">
            <span>{product}</span>

            <span>{formatNumber(amount)}</span>
          </div>
        ))}
      </div>

      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
}

const nodeTypes = {
  product: ProductNode,
  recipe: RecipeNode,
};

export default function ProductionGraph({ nodes, edges }) {
  console.log("GRAPH NODES:", nodes);
  console.log("GRAPH EDGES:", edges);

  console.log(
    nodes.map((node) => node),
  );

  return (
    <div className="production-graph">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />

        <Controls />

        <MiniMap
          nodeColor={(node) => {
            if (node.type === "recipe") {
              return "#2563eb";
            }

            if (node.type === "product") {
              if (node.data?.source === "buy") {
                return "#f59e0b";
              }

              if (node.data?.source === "raw") {
                return "#64748b";
              }

              return "#22c55e";
            }

            return "#ffffff";
          }}
          nodeStrokeWidth={0}
          maskColor="rgba(0, 0, 0, 0.5)"
        />
      </ReactFlow>
    </div>
  );
}

function formatNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }

  return Number(value.toFixed(3)).toLocaleString();
}
