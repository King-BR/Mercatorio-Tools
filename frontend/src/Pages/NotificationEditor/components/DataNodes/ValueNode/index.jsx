import { Handle, Position } from "@xyflow/react";
import BaseNode from "../../BaseNodes/BaseNode";

function valueNodeToText(data) {
  if (!data) return "";

  if (data.valueType === "string") {
    return `"${data.value ?? ""}"`;
  }

  if (data.valueType === "boolean") {
    return String(data.value);
  }

  return String(data.value ?? "");
}

export default function ValueNode({ data }) {
  return (
    <>
      <BaseNode title="VALUE" type="DATA" className="value-node">
        <div className="node-label">CONSTANT</div>

        <div className="node-value">{valueNodeToText(data)}</div>
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
