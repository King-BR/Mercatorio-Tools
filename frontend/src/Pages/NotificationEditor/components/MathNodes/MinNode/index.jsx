import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
} from "@xyflow/react";

import getDataValue from "../../../../../utils/notifications/getDataValue";
import BaseNode from "../../BaseNodes/BaseNode";

export default function MinNode({ id, data }) {
  const inputCount = data.inputCount;

  /*
   * There is always one extra empty input handle.
   *
   * This allows the user to keep connecting other Nodes indefinitely:
   *
   * input-0
   * input-1
   * input-2
   * ...
   */

  const totalHandles = Math.max(inputCount, 1) + 1;

  const connections = useNodeConnections({
    handleType: "target",
  });

  const inputNodes = Array.from({ length: totalHandles }).map(
    (_, index) =>
      connections.find(
        (connection) => connection.targetHandle === `input-${index}`,
      )?.source,
  );

  const nodesData = useNodesData(inputNodes);
  const inputValues = nodesData.map((nodeData) => getDataValue(nodeData));

  data.inputs = inputValues;
  data.output = Math.min(...(data.inputs || [0]));

  return (
    <>
      {Array.from({ length: totalHandles }).map((_, index) => {
        const top =
          totalHandles === 1
            ? "50%"
            : `${((index + 1) / (totalHandles + 1)) * 100}%`;

        return (
          <Handle
            key={`${id}-input-${index}`}
            type="target"
            position={Position.Left}
            id={`input-${index}`}
            className="flow-handle condition-input-handle"
            style={{ top }}
          />
        );
      })}

      <BaseNode title="MIN" type="MATH" className="math-node">
        <div className="node-display">
          <div className="node-operator-display">MIN {"("}</div>
          {data.inputs.join(", ")}
          <div className="node-operator-display">{")"} =</div>
          {data.output}
        </div>
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
