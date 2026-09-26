import BinaryNode from "../../BaseNodes/BinaryNode";

export default function CompareNode({ data }) {
  return (
    <BinaryNode title="COMPARE" type="LOGIC" className="compare-node">
      <div className="node-display">
        <div className="compare-operator-display">{data.operator || ">"}</div>
      </div>
    </BinaryNode>
  );
}
