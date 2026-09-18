import { useRoutedEdgePath } from "reactflow-edge-routing";
import { BaseEdge } from "@xyflow/react";

export default function RoutedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  ...props
}) {
  const [path, labelX, labelY] = useRoutedEdgePath({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge id={id} path={path} labelX={labelX} labelY={labelY} { ...props } />
  );
}
