import { Handle, Position } from "@xyflow/react";
import BaseNode from "../../BaseNodes/BaseNode";

export default function FieldNode({ data }) {
  var fieldText =
    data.fieldText || data.field?.path?.join(".") || "Configure field";

  return (
    <>
      <BaseNode title="FIELD" type="DATA" className="data-node">
        <div className="node-label">GAME FIELD</div>

        <div className="node-expression">{fieldText}</div>
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
