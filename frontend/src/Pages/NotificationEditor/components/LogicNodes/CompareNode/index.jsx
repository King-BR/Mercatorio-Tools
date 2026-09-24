import BinaryNode from "../../BaseNodes/BinaryNode";

export default function CompareNode({ data }) {
  return (
    <BinaryNode title="COMPARE" type="LOGIC" className="compare-node">
      <div className="node-display">
        {data.left}
        <div className="compare-operator-display">{data.operator || ">"}</div>
        {data.right}
        <div className="compare-operator-display">=</div>
        {data.left > data.right ? "true" : "false"}
      </div>
    </BinaryNode>
  );
}
