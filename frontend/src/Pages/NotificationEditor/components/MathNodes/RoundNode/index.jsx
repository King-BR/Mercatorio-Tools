import { useNodeConnections, useNodesData } from "@xyflow/react";

import getDataValue from "../../../../../utils/notifications/getDataValue";
import UnaryNode from "../../BaseNodes/UnaryNode";

export default function RoundNode({ data }) {
  const connections = useNodeConnections({
    handleType: "target",
  });

  const inputNode = connections.find(
    (connection) => connection.targetHandle === "input",
  )?.source;

  const nodesData = useNodesData([inputNode]);
  const inputNodeData = nodesData[0];
  const inputValue = getDataValue(inputNodeData);

  data.input = inputValue;
  data.output = Math.round(data.input);

  return (
    <UnaryNode title="ROUND" type="MATH" className="math-node">
      <div className="node-operator-display">ROUND {"("}</div>
      {data.input}
      <div className="node-operator-display">{") ="}</div>
      {data.output}
    </UnaryNode>
  );
}
