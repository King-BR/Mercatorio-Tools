import UnaryNode from "../../../BaseNodes/UnaryNode";

export default function NotNode({ data }) {
  return (
    <UnaryNode title="NOT" type="LOGIC" className="gate-node">
      <div className="gate-operator">NOT</div>
    </UnaryNode>
  );
}
