import { Handle, Position } from "@xyflow/react";

import BaseNode from "../BaseNode";

export default function BinaryNode({ title, type, children, className = "" }) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="flow-handle"
        style={{ top: "35%" }}
      />

      <Handle
        type="target"
        position={Position.Left}
        id="right"
        className="flow-handle"
        style={{ top: "65%" }}
      />

      <BaseNode title={title} type={type} className={`${className}`}>
        {children}
      </BaseNode>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="flow-handle"
      />
    </>
  );
}
