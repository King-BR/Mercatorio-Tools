import { Handle, Position } from "@xyflow/react";
import BaseNode from "../../../BaseNodes/BaseNode";

export default function XorNode({ id, data }) {
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

      <BaseNode title="XOR" type="LOGIC" className="gate-node">
        <div className="gate-operator">XOR</div>
      </BaseNode>

      <Handle
        key={`${id}-output`}
        type="source"
        position={Position.Right}
        id="output"
        className="flow-handle"
      />
    </>
  );
}
