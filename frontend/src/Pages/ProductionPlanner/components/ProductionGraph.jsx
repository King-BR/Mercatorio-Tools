import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

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

const ProductionGraphInner = forwardRef(function ProductionGraphInner(
  { nodes: initialNodes = [], edges: initialEdges = [], layoutVersion = 0 },
  ref,
) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [needsAutoLayout, setNeedsAutoLayout] = useState(false);

  const [isResettingLayout, setIsResettingLayout] = useState(false);

  const nodesInitialized = useNodesInitialized();

  const { fitView } = useReactFlow();

  /*
   * Update the graph when a new calculation
   * is made.
   */
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);

    setNeedsAutoLayout(initialNodes.length > 0);
  }, [layoutVersion, initialNodes, initialEdges, setNodes, setEdges]);

  /*
   * Automatically layout the graph after
   * a new production calculation.
   */
  useEffect(() => {
    if (!needsAutoLayout) {
      return;
    }

    if (!nodesInitialized) {
      return;
    }

    if (nodes.length === 0) {
      return;
    }

    let cancelled = false;

    async function applyLayout() {
      try {
        const layoutedNodes = await autoLayout(nodes, edges, "RIGHT");

        if (cancelled) {
          return;
        }

        setNodes(layoutedNodes);
        setNeedsAutoLayout(false);

        requestAnimationFrame(() => {
          if (cancelled) {
            return;
          }

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
   * Manually reset the layout.
   *
   * This does NOT recalculate production.
   * It only runs ELK again using the
   * current nodes and edges.
   */
  async function handleResetLayout() {
    if (nodes.length === 0 || isResettingLayout) {
      return;
    }

    setIsResettingLayout(true);

    try {
      const layoutedNodes = await autoLayout(nodes, edges, "RIGHT");

      setNodes(layoutedNodes);

      requestAnimationFrame(() => {
        fitView({
          padding: 0.2,
          duration: 500,
        });
      });
    } catch (error) {
      console.error("Failed to reset production graph layout:", error);
    } finally {
      setIsResettingLayout(false);
    }
  }

  /*
   * Expose resetLayout() to the parent.
   */
  useImperativeHandle(
    ref,
    () => ({
      resetLayout: handleResetLayout,
      isResettingLayout,
    }),
    [nodes, edges, isResettingLayout],
  );

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

            if (node.data?.isTarget) {
              return "#13AC18";
            }

            if (node.data?.source === "produce") {
              return "#F2FF01";
            }

            if (node.data?.source === "buy") {
              return "#00ECFD";
            }

            return "#AA1414";
          }}
          nodeStrokeWidth={10}
        />
      </ReactFlow>
    </div>
  );
});

const ProductionGraph = forwardRef(function ProductionGraph(props, ref) {
  return (
    <ReactFlowProvider>
      <ProductionGraphInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

export default ProductionGraph;
