import { useNodeConnections, useNodesData } from "@xyflow/react";

import getDataValue from "../../../../../utils/notifications/getDataValue";
import BinaryNode from "../../BaseNodes/BinaryNode";

export default function ModuloNode({ data }) {
  const connections = useNodeConnections({
    handleType: "target",
  });

  const leftNode = connections.find(
    (connection) => connection.targetHandle === "left",
  )?.source;
  const rightNode = connections.find(
    (connection) => connection.targetHandle === "right",
  )?.source;

  const nodesData = useNodesData([leftNode, rightNode]);

  const leftNodeData = nodesData[0];
  const rightNodeData = nodesData[1];

  const leftValue = getDataValue(leftNodeData);
  const rightValue = getDataValue(rightNodeData);
  const output = Number(leftValue) % Number(rightValue);

  data.output = output;
  data.left = leftValue;
  data.right = rightValue;

  return (
    <BinaryNode title="MODULO" type="MATH" className="math-node">
      <div className="node-display">
        {data.left}
        <div className="node-operator-display">{data.operator}</div>
        {data.right}
        <div className="node-operator-display">=</div>
        {data.output}
      </div>
    </BinaryNode>
  );
}
