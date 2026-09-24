import { Handle, Position } from "@xyflow/react";
import BaseNode from "../../BaseNodes/BaseNode";

export default function WebhookNode({ data }) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="flow-handle"
      />

      <BaseNode title="WEBHOOK" type="ACTION" className="action-node">
        <div className="node-description">Send an HTTP webhook request.</div>

        <div className="node-summary">{data.url || "No URL configured"}</div>
      </BaseNode>
    </>
  );
}
