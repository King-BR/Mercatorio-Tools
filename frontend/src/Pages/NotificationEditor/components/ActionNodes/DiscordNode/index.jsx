import { Handle, Position } from "@xyflow/react";
import BaseNode from "../../BaseNodes/BaseNode";

export default function DiscordNode({ data }) {
  var message = data.message || "No message configured";

  // Get {variable} placeholders from the message
  var placeholders = message.match(/{[^}]+}/g) || [];

  // Split message into parts: text and placeholders
  var messageParts = message.split(/({[^}]+})/g);

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="flow-handle"
      />

      <BaseNode title="DISCORD" type="ACTION" className="action-node">
        <div className="node-description">Send a Discord notification.</div>

        <div className="node-summary">
          <strong>Message</strong>
        </div>
        <div className="node-summary">
          <div>
            {messageParts.map((part, index) =>
              placeholders.includes(part) ? (
                <span key={`placeholder-${index}`} className="node-expression">
                  {part}
                </span>
              ) : (
                part
              ),
            )}
          </div>
        </div>
      </BaseNode>
    </>
  );
}
