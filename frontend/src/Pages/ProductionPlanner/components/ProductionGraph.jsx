import { useEffect, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import ProductNode from "./ProductNode";
import RecipeNode from "./RecipeNode";

import { autoLayout } from "../../../utils/production/autoLayout";

const nodeTypes = {
  product: ProductNode,
  recipe: RecipeNode,
};

function ProductionGraphInner({
  nodes: initialNodes = [],
  edges: initialEdges = [],
  layoutVersion = 0,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [needsAutoLayout, setNeedsAutoLayout] = useState(false);

  const nodesInitialized = useNodesInitialized();

  const { fitView } = useReactFlow();

  /*
   * Every time layoutVersion changes, the graph is considered a
   * completely new calculation and should be auto-laid out again.
   */
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);

    setNeedsAutoLayout(initialNodes.length > 0);
  }, [layoutVersion, initialNodes, initialEdges, setNodes, setEdges]);

  /*
   * Wait until React Flow has measured the nodes before asking ELK
   * to calculate their positions.
   */
  useEffect(() => {
    if (!needsAutoLayout) return;
    if (!nodesInitialized) return;
    if (nodes.length === 0) return;

    let cancelled = false;

    async function applyLayout() {
      try {
        const layoutedNodes = await autoLayout(nodes, edges, "RIGHT");

        if (cancelled) return;

        setNodes(layoutedNodes);
        setNeedsAutoLayout(false);

        /*
         * Wait one frame so React Flow has applied the new positions
         * before fitting the viewport.
         */
        requestAnimationFrame(() => {
          if (cancelled) return;

          fitView({
            padding: 0.2,
            duration: 500,
          });
        });
      } catch (error) {
        console.error("Failed to auto-layout production graph:", error);

        if (!cancelled) {
          setNeedsAutoLayout(false);

          requestAnimationFrame(() => {
            fitView({
              padding: 0.2,
              duration: 500,
            });
          });
        }
      }
    }

    applyLayout();

    return () => {
      cancelled = true;
    };
  }, [needsAutoLayout, nodesInitialized, nodes, edges, setNodes, fitView]);

  /*
   * If the graph is empty, clear the local React Flow state.
   */
  const isEmpty = nodes.length === 0;

  return (
    <div
      className="production-graph"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{
          padding: 0.2,
        }}
        minZoom={0.05}
        maxZoom={2}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        onlyRenderVisibleElements
      >
        <Background />

        <Controls />

        <MiniMap
          pannable
          zoomable
          nodeColor={(node) => {
            if (node.type === "recipe") {
              return "#36536e";
            }

            if (node.data?.source?.type === "buy") {
              return "#AA1414";
            }

            return "#13AC18";
          }}
          nodeStrokeWidth={10}
        />
      </ReactFlow>

      {isEmpty && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            color: "#8da2b8",
            fontSize: "14px",
          }}
        >
          Configure a production line to see the graph.
        </div>
      )}
    </div>
  );
}

export default function ProductionGraph(props) {
  return (
    <ReactFlowProvider>
      <ProductionGraphInner {...props} />
    </ReactFlowProvider>
  );
}
