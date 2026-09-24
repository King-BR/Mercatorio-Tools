import BinaryNode from "../../BaseNodes/BinaryNode";

export default function AddNode({ data }) {
  data.output = Number(data.left) + Number(data.right);
  return (
    <BinaryNode title="ADD" type="MATH" className="math-node">
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
