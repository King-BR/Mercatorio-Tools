import { Handle, Position } from "@xyflow/react";

import BaseNode from "../BaseNode";

export default function UnaryNode({ title, type, children, className = "" }) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="flow-handle"
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
