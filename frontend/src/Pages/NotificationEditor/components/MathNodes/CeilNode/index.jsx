import { useNodeConnections, useNodesData } from "@xyflow/react";

import getDataValue from "../../../../../utils/notifications/getDataValue";
import UnaryNode from "../../BaseNodes/UnaryNode";

export default function CeilNode({ data }) {
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
  data.output = Math.ceil(data.input);

  return (
    <UnaryNode title="CEIL" type="MATH" className="math-node">
      <div className="node-operator-display">CEIL {"("}</div>
      {data.input}
      <div className="node-operator-display">{") ="}</div>
      {data.output}
    </UnaryNode>
  );
}
