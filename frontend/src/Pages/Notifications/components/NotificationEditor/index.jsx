import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  addEdge,
  useEdgesState,
  useNodesState,
  useUpdateNodeInternals,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./NotificationEditor.css";

const API = "/api/notifications";

/* -------------------------------------------------------------------------- */
/* IDs                                                                        */
/* -------------------------------------------------------------------------- */

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/* -------------------------------------------------------------------------- */
/* Fields                                                                     */
/* -------------------------------------------------------------------------- */

function flattenFields(fields) {
  const result = [];

  function walk(value, path = []) {
    if (!value || typeof value !== "object") return;

    for (const [key, entry] of Object.entries(value)) {
      if (
        entry &&
        typeof entry === "object" &&
        typeof entry.type === "string" &&
        Array.isArray(entry.operators)
      ) {
        result.push({
          path: [...path, key],
          key,
          label: [...path, key].join(" → "),
          type: entry.type,
          operators: entry.operators,
        });

        continue;
      }

      if (entry && typeof entry === "object") {
        walk(entry, [...path, key]);
      }
    }
  }

  walk(fields);

  return result;
}

function getFieldCategory(field) {
  if (!field?.path?.length) return null;

  if (field.path[0] === "town_X") {
    return "town";
  }

  if (field.path[0] === "inventory") {
    return "inventory";
  }

  if (field.path[0] === "building_X") {
    return "building";
  }

  return null;
}

function getActualFieldPath(field, reference = {}) {
  if (!field) return [];

  const path = [...field.path];

  if (path[0] === "town_X") {
    path[0] = reference.entityId || "town_X";
  }

  if (path[0] === "building_X") {
    path[0] = reference.entityId || "building_X";
  }

  const productIndex = path.indexOf("product_X");

  if (productIndex !== -1) {
    path[productIndex] = reference.productId || "product_X";
  }

  return path;
}

function fieldToText(fieldData, fields) {
  if (!fieldData) return "";

  const field = fields.find(
    (item) => JSON.stringify(item.path) === JSON.stringify(fieldData.path),
  );

  if (!field) return "";

  return getActualFieldPath(field, fieldData.reference).join(".");
}

/* -------------------------------------------------------------------------- */
/* Data factories                                                             */
/* -------------------------------------------------------------------------- */

function createFieldData(fields) {
  const first = fields[0];

  return {
    nodeType: "field",

    field: {
      path: first?.path || [],
      fieldType: first?.type || "number",

      reference: {
        entityType: getFieldCategory(first) || "town",
        entityId: "",
        productId: "",
      },
    },
  };
}

function createValueData() {
  return {
    nodeType: "value",

    value: 0,
    valueType: "number",
  };
}

function createCompareData() {
  return {
    nodeType: "compare",
    operator: ">",
  };
}

function createConditionData() {
  return {
    nodeType: "condition",
    operator: "AND",
    inputCount: 1,
  };
}

function createDiscordData() {
  return {
    nodeType: "discord",
    channel: "",
    message: "",
  };
}

function createWebhookData() {
  return {
    nodeType: "webhook",
    url: "",
    method: "POST",
    body: "",
  };
}

/* -------------------------------------------------------------------------- */
/* Text helpers                                                               */
/* -------------------------------------------------------------------------- */

function valueNodeToText(data) {
  if (!data) return "";

  if (data.valueType === "string") {
    return `"${data.value ?? ""}"`;
  }

  if (data.valueType === "boolean") {
    return String(data.value);
  }

  return String(data.value ?? "");
}

/* -------------------------------------------------------------------------- */
/* Base node                                                                  */
/* -------------------------------------------------------------------------- */

function BaseNode({ title, type, children, className = "" }) {
  return (
    <div className={`notification-node ${className}`}>
      <div className="notification-node-header">
        <span>{title}</span>

        <span className="notification-node-type">{type}</span>
      </div>

      <div className="notification-node-content">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Field node                                                                 */
/* -------------------------------------------------------------------------- */

function FieldNode({ data }) {
  const fieldText =
    data.fieldText || data.field?.path?.join(".") || "Configure field";

  return (
    <>
      <BaseNode title="Field" type="DATA" className="field-node">
        <div className="node-label">GAME FIELD</div>

        <div className="node-expression">{fieldText}</div>
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

/* -------------------------------------------------------------------------- */
/* Value node                                                                 */
/* -------------------------------------------------------------------------- */

function ValueNode({ data }) {
  return (
    <>
      <BaseNode title="Value" type="DATA" className="value-node">
        <div className="node-label">CONSTANT</div>

        <div className="node-value">{valueNodeToText(data)}</div>
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

/* -------------------------------------------------------------------------- */
/* Compare node                                                               */
/* -------------------------------------------------------------------------- */

function CompareNode({ data }) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="flow-handle"
        style={{ top: "35%" }}
      />

      <Handle
        type="target"
        position={Position.Left}
        id="right"
        className="flow-handle"
        style={{ top: "65%" }}
      />

      <BaseNode title="Compare" type="LOGIC" className="compare-node">
        <div className="compare-operator-display">{data.operator || ">"}</div>

        <div className="compare-input-labels">
          <span>LEFT</span>
          <span>RIGHT</span>
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

/* -------------------------------------------------------------------------- */
/* Condition node                                                             */
/* -------------------------------------------------------------------------- */

function ConditionNode({ id, data }) {
  const inputCount = Math.max(Number(data.inputCount) || 1, 1);

  /*
   * There is always one extra empty input handle.
   *
   * This allows the user to keep connecting CompareNodes indefinitely:
   *
   * input-0
   * input-1
   * input-2
   * ...
   */

  const totalHandles = inputCount + 1;

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

      <BaseNode title="Condition" type="LOGIC" className="condition-node">
        <div className="condition-operator">{data.operator || "AND"}</div>

        <div className="condition-description">Compare results</div>

        <div className="condition-input-count">
          {inputCount} comparison
          {inputCount === 1 ? "" : "s"}
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

/* -------------------------------------------------------------------------- */
/* Discord node                                                               */
/* -------------------------------------------------------------------------- */

function DiscordNode({ data }) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="flow-handle"
      />

      <BaseNode title="Discord" type="ACTION" className="discord-node">
        <div className="node-description">Send a Discord notification.</div>

        <div className="node-summary">
          <strong>Message</strong>
        </div>
        <div className="node-summary">
          {data.message || "No message configured"}
        </div>
        <br/>
        <div className="node-summary">
          <strong>Channel</strong>
        </div>
        <div className="node-summary">
          {data.channel || "No channel configured"}
        </div>
      </BaseNode>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Webhook node                                                               */
/* -------------------------------------------------------------------------- */

function WebhookNode({ data }) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="flow-handle"
      />

      <BaseNode title="Webhook" type="ACTION" className="webhook-node">
        <div className="node-description">Send an HTTP webhook request.</div>

        <div className="node-summary">{data.url || "No URL configured"}</div>
      </BaseNode>
    </>
  );
}

const nodeTypes = {
  field: FieldNode,
  value: ValueNode,
  compare: CompareNode,
  condition: ConditionNode,
  discord: DiscordNode,
  webhook: WebhookNode,
};

/* -------------------------------------------------------------------------- */
/* Field properties                                                           */
/* -------------------------------------------------------------------------- */

function FieldProperties({ node, fields, onChange }) {
  const fieldData = node.data.field || createFieldData(fields).field;

  const field =
    fields.find(
      (item) => JSON.stringify(item.path) === JSON.stringify(fieldData.path),
    ) || fields[0];

  const category = getFieldCategory(field);

  const updateField = (value) => {
    const nextField = fields.find((item) => item.label === value);

    if (!nextField) return;

    const nextReference = {
      ...fieldData.reference,

      entityType:
        getFieldCategory(nextField) ||
        fieldData.reference?.entityType ||
        "town",

      productId: nextField.path.includes("product_X")
        ? fieldData.reference?.productId || ""
        : "",
    };

    const nextFieldData = {
      ...fieldData,

      path: nextField.path,

      fieldType: nextField.type,

      reference: nextReference,
    };

    onChange({
      ...node.data,

      field: nextFieldData,

      fieldText: fieldToText(
        {
          path: nextField.path,
          fieldType: nextField.type,
          reference: nextReference,
        },
        fields,
      ),
    });
  };

  const updateReference = (reference) => {
    const nextFieldData = {
      ...fieldData,

      reference: {
        ...fieldData.reference,
        ...reference,
      },
    };

    onChange({
      ...node.data,

      field: nextFieldData,

      fieldText: fieldToText(nextFieldData, fields),
    });
  };

  return (
    <div className="properties-section">
      <div className="property-card">
        <div className="property-card-title">FIELD</div>

        <label>
          Field
          <select
            value={field?.label || ""}
            onChange={(event) => updateField(event.target.value)}
          >
            {fields.map((item) => (
              <option key={item.label} value={item.label}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        {category === "town" && (
          <label>
            Town ID
            <input
              type="text"
              value={fieldData.reference?.entityId || ""}
              placeholder="town_1"
              onChange={(event) =>
                updateReference({
                  entityType: "town",
                  entityId: event.target.value,
                })
              }
            />
          </label>
        )}

        {category === "building" && (
          <label>
            Building ID
            <input
              type="text"
              value={fieldData.reference?.entityId || ""}
              placeholder="building_1"
              onChange={(event) =>
                updateReference({
                  entityType: "building",
                  entityId: event.target.value,
                })
              }
            />
          </label>
        )}

        {field?.path?.includes("product_X") && (
          <label>
            Product ID
            <input
              type="text"
              value={fieldData.reference?.productId || ""}
              placeholder="iron"
              onChange={(event) =>
                updateReference({
                  productId: event.target.value,
                })
              }
            />
          </label>
        )}

        <div className="field-preview">
          {fieldToText(fieldData, fields) || "Incomplete field reference"}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Value properties                                                           */
/* -------------------------------------------------------------------------- */

function ValueProperties({ node, onChange }) {
  const data = node.data;

  return (
    <div className="properties-section">
      <div className="property-card">
        <div className="property-card-title">VALUE</div>

        <label>
          Type
          <select
            value={data.valueType || "number"}
            onChange={(event) => {
              const valueType = event.target.value;

              onChange({
                ...data,

                valueType,

                value:
                  valueType === "number"
                    ? 0
                    : valueType === "boolean"
                      ? false
                      : "",
              });
            }}
          >
            <option value="number">Number</option>

            <option value="string">String</option>

            <option value="boolean">Boolean</option>
          </select>
        </label>

        {data.valueType === "boolean" ? (
          <label>
            Value
            <select
              value={String(data.value)}
              onChange={(event) =>
                onChange({
                  ...data,

                  value: event.target.value === "true",
                })
              }
            >
              <option value="true">true</option>

              <option value="false">false</option>
            </select>
          </label>
        ) : (
          <label>
            Value
            <input
              type={data.valueType === "number" ? "number" : "text"}
              value={data.value ?? ""}
              onChange={(event) =>
                onChange({
                  ...data,

                  value:
                    data.valueType === "number"
                      ? event.target.value === ""
                        ? ""
                        : Number(event.target.value)
                      : event.target.value,
                })
              }
            />
          </label>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Compare properties                                                         */
/* -------------------------------------------------------------------------- */

const COMPARISON_OPERATORS = ["<", "<=", "==", ">=", ">", "!="];

function CompareProperties({ node, onChange }) {
  return (
    <div className="properties-section">
      <div className="property-card">
        <div className="property-card-title">COMPARISON</div>

        <label>
          Operator
          <select
            value={node.data.operator || ">"}
            onChange={(event) =>
              onChange({
                ...node.data,

                operator: event.target.value,
              })
            }
          >
            {COMPARISON_OPERATORS.map((operator) => (
              <option key={operator} value={operator}>
                {operator}
              </option>
            ))}
          </select>
        </label>

        <div className="property-help">
          Connect a Field or Value node to each of the two inputs.
        </div>

        <div className="comparison-preview">
          <span>LEFT</span>

          <strong>{node.data.operator || ">"}</strong>

          <span>RIGHT</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Condition properties                                                       */
/* -------------------------------------------------------------------------- */

function ConditionProperties({ node, onChange }) {
  return (
    <div className="properties-section">
      <div className="property-card">
        <div className="property-card-title">CONDITION</div>

        <label>
          Operator
          <select
            value={node.data.operator || "AND"}
            onChange={(event) =>
              onChange({
                ...node.data,

                operator: event.target.value,
              })
            }
          >
            <option value="AND">AND</option>

            <option value="OR">OR</option>
          </select>
        </label>

        <div className="property-help">
          Connect as many Compare nodes as needed.
        </div>

        <div className="condition-properties-count">
          {node.data.inputCount || 1} comparison
          {(node.data.inputCount || 1) === 1 ? "" : "s"} connected.
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Action properties                                                          */
/* -------------------------------------------------------------------------- */

function ActionProperties({ node, onChange }) {
  if (node.type === "discord") {
    return (
      <div className="properties-section">
        <label>
          Channel
          <input
            type="text"
            value={node.data.channel || ""}
            placeholder="Discord channel ID"
            onChange={(event) =>
              onChange({
                ...node.data,

                channel: event.target.value,
              })
            }
          />
        </label>

        <label>
          Message
          <textarea
            value={node.data.message || ""}
            placeholder="Notification message..."
            rows={7}
            onChange={(event) =>
              onChange({
                ...node.data,

                message: event.target.value,
              })
            }
          />
        </label>
      </div>
    );
  }

  if (node.type === "webhook") {
    return (
      <div className="properties-section">
        <label>
          URL
          <input
            type="url"
            value={node.data.url || ""}
            placeholder="https://example.com/webhook"
            onChange={(event) =>
              onChange({
                ...node.data,

                url: event.target.value,
              })
            }
          />
        </label>

        <label>
          Method
          <select
            value={node.data.method || "POST"}
            onChange={(event) =>
              onChange({
                ...node.data,

                method: event.target.value,
              })
            }
          >
            <option value="POST">POST</option>

            <option value="PUT">PUT</option>

            <option value="PATCH">PATCH</option>
          </select>
        </label>

        <label>
          Body
          <textarea
            value={node.data.body || ""}
            placeholder='{"message":"Hello"}'
            rows={8}
            onChange={(event) =>
              onChange({
                ...node.data,

                body: event.target.value,
              })
            }
          />
        </label>
      </div>
    );
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Node properties                                                            */
/* -------------------------------------------------------------------------- */

function NodeProperties({ node, fields, onChange }) {
  if (!node) {
    return (
      <div className="empty-properties">
        <div className="empty-properties-icon">↖</div>

        <p>Select a node to edit its properties.</p>
      </div>
    );
  }

  if (node.type === "field") {
    return <FieldProperties node={node} fields={fields} onChange={onChange} />;
  }

  if (node.type === "value") {
    return <ValueProperties node={node} onChange={onChange} />;
  }

  if (node.type === "compare") {
    return <CompareProperties node={node} onChange={onChange} />;
  }

  if (node.type === "condition") {
    return <ConditionProperties node={node} onChange={onChange} />;
  }

  if (node.type === "discord" || node.type === "webhook") {
    return <ActionProperties node={node} onChange={onChange} />;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Connection validation                                                      */
/* -------------------------------------------------------------------------- */

function isValidConnection(connection, nodes, edges) {
  const source = nodes.find((node) => node.id === connection.source);

  const target = nodes.find((node) => node.id === connection.target);

  if (!source || !target) {
    return false;
  }

  /*
   * Prevent self connections.
   */
  if (source.id === target.id) {
    return false;
  }

  /*
   * FieldNode / ValueNode -> CompareNode
   */
  if (target.type === "compare") {
    if (source.type !== "field" && source.type !== "value") {
      return false;
    }

    if (
      connection.targetHandle !== "left" &&
      connection.targetHandle !== "right"
    ) {
      return false;
    }

    /*
     * Each Compare input accepts only one connection.
     */
    const alreadyConnected = edges.some(
      (edge) =>
        edge.target === target.id &&
        edge.targetHandle === connection.targetHandle,
    );

    if (alreadyConnected) {
      return false;
    }

    return true;
  }

  /*
   * CompareNode -> ConditionNode
   */
  if (target.type === "condition") {
    if (source.type !== "compare") {
      return false;
    }

    if (!connection.targetHandle?.startsWith("input-")) {
      return false;
    }

    /*
     * One connection per Condition input handle.
     */
    const alreadyConnected = edges.some(
      (edge) =>
        edge.target === target.id &&
        edge.targetHandle === connection.targetHandle,
    );

    if (alreadyConnected) {
      return false;
    }

    return true;
  }

  /*
   * ConditionNode -> Discord/Webhook
   */
  if (target.type === "discord" || target.type === "webhook") {
    if (source.type !== "condition") {
      return false;
    }

    const alreadyConnected = edges.some(
      (edge) =>
        edge.target === target.id &&
        edge.targetHandle === connection.targetHandle,
    );

    if (alreadyConnected) {
      return false;
    }

    return true;
  }

  return false;
}

/* -------------------------------------------------------------------------- */
/* Main editor                                                                */
/* -------------------------------------------------------------------------- */

function NotificationEditorInner({ notificationId, onBack }) {
  const [notification, setNotification] = useState(null);

  const [fieldsDefinition, setFieldsDefinition] = useState({});

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const updateNodeInternals = useUpdateNodeInternals();

  const fields = useMemo(
    () => flattenFields(fieldsDefinition),
    [fieldsDefinition],
  );

  /* ---------------------------------------------------------------------- */
  /* Refresh Condition handles                                               */
  /* ---------------------------------------------------------------------- */

  const refreshConditionHandles = useCallback(
    (conditionId, inputCount) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === conditionId
            ? {
                ...node,

                data: {
                  ...node.data,

                  inputCount,
                },
              }
            : node,
        ),
      );

      requestAnimationFrame(() => {
        updateNodeInternals(conditionId);
      });
    },
    [setNodes, updateNodeInternals],
  );

  /* ---------------------------------------------------------------------- */
  /* Load                                                                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const fieldsResponse = await fetch(`${API}/fields`);

        if (!fieldsResponse.ok) {
          throw new Error("Failed to load notification fields.");
        }

        const fieldsJson = await fieldsResponse.json();

        if (cancelled) return;

        const definition = fieldsJson.fields || {};

        setFieldsDefinition(definition);

        const availableFields = flattenFields(definition);

        if (!notificationId) {
          const fieldId = makeId("field");
          const valueId = makeId("value");
          const compareId = makeId("compare");
          const conditionId = makeId("condition");
          const discordId = makeId("discord");

          const fieldData = createFieldData(availableFields);

          fieldData.fieldText = fieldToText(fieldData.field, availableFields);

          const initialNodes = [
            {
              id: fieldId,
              type: "field",
              position: {
                x: 80,
                y: 120,
              },
              data: fieldData,
            },

            {
              id: valueId,
              type: "value",
              position: {
                x: 80,
                y: 320,
              },
              data: createValueData(),
            },

            {
              id: compareId,
              type: "compare",
              position: {
                x: 450,
                y: 200,
              },
              data: createCompareData(),
            },

            {
              id: conditionId,
              type: "condition",
              position: {
                x: 780,
                y: 200,
              },
              data: createConditionData(),
            },

            {
              id: discordId,
              type: "discord",
              position: {
                x: 1100,
                y: 200,
              },
              data: createDiscordData(),
            },
          ];

          const initialEdges = [
            {
              id: makeId("edge"),
              source: fieldId,
              sourceHandle: "output",
              target: compareId,
              targetHandle: "left",
              type: "smoothstep",
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            },

            {
              id: makeId("edge"),
              source: valueId,
              sourceHandle: "output",
              target: compareId,
              targetHandle: "right",
              type: "smoothstep",
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            },

            {
              id: makeId("edge"),
              source: compareId,
              sourceHandle: "output",
              target: conditionId,
              targetHandle: "input-0",
              type: "smoothstep",
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            },

            {
              id: makeId("edge"),
              source: conditionId,
              sourceHandle: "output",
              target: discordId,
              targetHandle: "input",
              type: "smoothstep",
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            },
          ];

          setNodes(initialNodes);

          setEdges(initialEdges);

          setNotification({
            name: "New notification",
            description: "",
            enabled: true,
          });

          setSelectedNodeId(fieldId);

          return;
        }

        const response = await fetch(`${API}/${notificationId}`);

        if (!response.ok) {
          throw new Error("Failed to load notification.");
        }

        const json = await response.json();

        if (cancelled) return;

        setNotification(json.notification);

        const loadedNodes = (json.notification.nodes || []).map((node) => {
          const data = node.data || {};

          /*
           * Make sure old/partial Condition nodes have
           * enough handles for their current connections.
           */
          if (node.type === "condition") {
            const conditionEdges = (json.notification.edges || []).filter(
              (edge) =>
                edge.target === node.id &&
                edge.targetHandle?.startsWith("input-"),
            );

            const highestIndex = conditionEdges.reduce((highest, edge) => {
              const index = Number(edge.targetHandle.replace("input-", ""));

              return Number.isFinite(index)
                ? Math.max(highest, index)
                : highest;
            }, -1);

            data.inputCount = Math.max(
              Number(data.inputCount) || 1,
              highestIndex + 1,
              1,
            );
          }

          if (node.type === "field" && data.field) {
            data.fieldText = fieldToText(data.field, availableFields);
          }

          return {
            ...node,
            data,
          };
        });

        setNodes(loadedNodes);

        setEdges(
          (json.notification.edges || []).map((edge) => ({
            ...edge,

            markerEnd: edge.markerEnd || {
              type: MarkerType.ArrowClosed,
            },
          })),
        );
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load notification.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [notificationId, setNodes, setEdges]);

  /* ---------------------------------------------------------------------- */
  /* Connect                                                                  */
  /* ---------------------------------------------------------------------- */

  const onConnect = useCallback(
    (connection) => {
      setEdges((currentEdges) => {
        if (!isValidConnection(connection, nodes, currentEdges)) {
          return currentEdges;
        }

        const nextEdges = addEdge(
          {
            ...connection,

            type: "smoothstep",

            animated: true,

            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          currentEdges,
        );

        /*
         * If a CompareNode was connected to a
         * ConditionNode, create another input handle.
         */
        const targetNode = nodes.find((node) => node.id === connection.target);

        if (targetNode?.type === "condition") {
          const connectedInputs = nextEdges.filter(
            (edge) =>
              edge.target === targetNode.id &&
              edge.targetHandle?.startsWith("input-"),
          ).length;

          refreshConditionHandles(targetNode.id, Math.max(connectedInputs, 1));
        }

        return nextEdges;
      });
    },
    [nodes, setEdges, refreshConditionHandles],
  );

  /* ---------------------------------------------------------------------- */
  /* Edge changes                                                             */
  /* ---------------------------------------------------------------------- */

  const handleEdgesChange = useCallback(
    (changes) => {
      const removedEdges = changes.filter((change) => change.type === "remove");

      onEdgesChange(changes);

      if (!removedEdges.length) {
        return;
      }

      requestAnimationFrame(() => {
        setEdges((currentEdges) => {
          const affectedConditions = new Set();

          for (const edge of removedEdges) {
            if (edge.id == null) {
              continue;
            }

            const removedEdge = edges.find((item) => item.id === edge.id);

            if (
              removedEdge?.target &&
              removedEdge.targetHandle?.startsWith("input-")
            ) {
              affectedConditions.add(removedEdge.target);
            }
          }

          for (const conditionId of affectedConditions) {
            const connectedInputs = currentEdges.filter(
              (item) =>
                item.target === conditionId &&
                item.targetHandle?.startsWith("input-"),
            ).length;

            refreshConditionHandles(conditionId, Math.max(connectedInputs, 1));
          }

          return currentEdges;
        });
      });
    },
    [edges, onEdgesChange, setEdges, refreshConditionHandles],
  );

  /* ---------------------------------------------------------------------- */
  /* Add node                                                                 */
  /* ---------------------------------------------------------------------- */

  const addNode = useCallback(
    (type) => {
      const id = makeId(type);

      const position = {
        x: 250 + Math.random() * 300,

        y: 100 + Math.random() * 400,
      };

      let data;

      if (type === "field") {
        data = createFieldData(fields);

        data.fieldText = fieldToText(data.field, fields);
      }

      if (type === "value") {
        data = createValueData();
      }

      if (type === "compare") {
        data = createCompareData();
      }

      if (type === "condition") {
        data = createConditionData();
      }

      if (type === "discord") {
        data = createDiscordData();
      }

      if (type === "webhook") {
        data = createWebhookData();
      }

      setNodes((current) => [
        ...current,

        {
          id,
          type,
          position,
          data,
        },
      ]);

      setSelectedNodeId(id);
    },
    [fields, setNodes],
  );

  /* ---------------------------------------------------------------------- */
  /* Selected node                                                            */
  /* ---------------------------------------------------------------------- */

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId],
  );

  const updateSelectedNode = useCallback(
    (data) => {
      if (!selectedNodeId) return;

      setNodes((current) =>
        current.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data,
              }
            : node,
        ),
      );

      if (selectedNode?.type === "condition") {
        requestAnimationFrame(() => {
          updateNodeInternals(selectedNodeId);
        });
      }
    },
    [selectedNodeId, selectedNode, setNodes, updateNodeInternals],
  );

  /* ---------------------------------------------------------------------- */
  /* Delete node                                                             */
  /* ---------------------------------------------------------------------- */

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;

    const deletedNode = nodes.find((node) => node.id === selectedNodeId);

    setNodes((current) => current.filter((node) => node.id !== selectedNodeId));

    setEdges((current) =>
      current.filter(
        (edge) =>
          edge.source !== selectedNodeId && edge.target !== selectedNodeId,
      ),
    );

    /*
     * If a CompareNode was removed from a
     * ConditionNode, recalculate its inputs.
     */
    if (deletedNode?.type === "compare") {
      const affectedConditions = nodes
        .filter(
          (node) =>
            node.type === "condition" &&
            edges.some(
              (edge) =>
                edge.source === selectedNodeId && edge.target === node.id,
            ),
        )
        .map((node) => node.id);

      requestAnimationFrame(() => {
        for (const conditionId of affectedConditions) {
          const count = edges.filter(
            (edge) =>
              edge.target === conditionId &&
              edge.source !== selectedNodeId &&
              edge.targetHandle?.startsWith("input-"),
          ).length;

          refreshConditionHandles(conditionId, Math.max(count, 1));
        }
      });
    }

    setSelectedNodeId(null);
  }, [
    selectedNodeId,
    nodes,
    edges,
    setNodes,
    setEdges,
    refreshConditionHandles,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Save                                                                     */
  /* ---------------------------------------------------------------------- */

  async function save() {
    if (!notification) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: notification.name,
        description: notification.description,
        enabled: notification.enabled,

        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })),

        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          type: edge.type,
          animated: edge.animated,
          markerEnd: edge.markerEnd,
        })),
      };

      const url = notificationId ? `${API}/${notificationId}` : API;

      const method = notificationId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Failed to save notification.");
      }

      if (json.notification) {
        setNotification(json.notification);

        if (!notificationId && json.notification._id) {
          window.history.replaceState(
            null,
            "",
            `/notifications?id=${json.notification._id}`,
          );
        }
      }
    } catch (err) {
      setError(err.message || "Failed to save notification.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Render                                                                   */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="notification-editor-loading">
        Loading notification editor...
      </div>
    );
  }

  if (error && !notification) {
    return (
      <div className="notification-editor-error">
        <p>{error}</p>

        <button type="button" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="notification-editor">
      <header className="notification-editor-header">
        <div className="notification-editor-title">
          <button type="button" className="back-button" onClick={onBack}>
            ←
          </button>

          <div>
            <input
              className="notification-name-input"
              value={notification?.name || ""}
              onChange={(event) =>
                setNotification((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Notification name"
            />

            <input
              className="notification-description-input"
              value={notification?.description || ""}
              onChange={(event) =>
                setNotification((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Description"
            />
          </div>
        </div>

        <div className="notification-editor-actions">
          {error && <span className="save-error">{error}</span>}

          <label className="enabled-toggle">
            <input
              type="checkbox"
              checked={notification?.enabled !== false}
              onChange={(event) =>
                setNotification((current) => ({
                  ...current,
                  enabled: event.target.checked,
                }))
              }
            />
            Enabled
          </label>

          <button
            type="button"
            className="save-button"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      <div className="notification-editor-body">
        <aside className="notification-sidebar">
          <div className="sidebar-section">
            <h3>Data</h3>

            <button type="button" onClick={() => addNode("field")}>
              + Field
            </button>

            <button type="button" onClick={() => addNode("value")}>
              + Value
            </button>
          </div>

          <div className="sidebar-section">
            <h3>Logic</h3>

            <button type="button" onClick={() => addNode("compare")}>
              + Compare
            </button>

            <button type="button" onClick={() => addNode("condition")}>
              + Condition
            </button>
          </div>

          <div className="sidebar-section">
            <h3>Actions</h3>

            <button type="button" onClick={() => addNode("discord")}>
              + Discord
            </button>

            <button type="button" onClick={() => addNode("webhook")}>
              + Webhook
            </button>
          </div>

          <div className="sidebar-section">
            <h3>Selected node</h3>

            <NodeProperties
              node={selectedNode}
              fields={fields}
              onChange={updateSelectedNode}
            />

            {selectedNode && (
              <button
                type="button"
                className="delete-node-button"
                onClick={deleteSelectedNode}
              >
                Delete node
              </button>
            )}
          </div>
        </aside>

        <main className="notification-flow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            isValidConnection={(connection) =>
              isValidConnection(connection, nodes, edges)
            }
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              type: "smoothstep",

              animated: true,

              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            }}
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background gap={20} size={1} />

            <Controls />

            <MiniMap nodeStrokeWidth={3} zoomable pannable />
          </ReactFlow>
        </main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

export default function NotificationEditor(props) {
  return (
    <ReactFlowProvider>
      <NotificationEditorInner {...props} />
    </ReactFlowProvider>
  );
}
