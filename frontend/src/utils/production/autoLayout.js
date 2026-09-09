import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

export async function autoLayout(nodes, edges, direction = "RIGHT") {
  if (!nodes.length) {
    return nodes;
  }

  const graph = {
    id: "production-graph",

    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,

      "elk.spacing.nodeNode": "50",
      "elk.layered.spacing.nodeNodeBetweenLayers": "100",

      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",

      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",

      "elk.edgeRouting": "ORTHOGONAL",
    },

    children: nodes.map((node) => ({
      id: node.id,

      width: node.measured?.width || node.width || 180,

      height: node.measured?.height || node.height || 80,
    })),

    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout = await elk.layout(graph);

  const positions = new Map(
    layout.children.map((node) => [
      node.id,
      {
        x: node.x,
        y: node.y,
      },
    ]),
  );

  return nodes.map((node) => {
    const position = positions.get(node.id);

    if (!position) {
      return node;
    }

    return {
      ...node,
      position,
      positionAbsolute: position,
    };
  });
}
