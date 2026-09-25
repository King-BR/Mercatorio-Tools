const {
  sendDiscordMessage,
  sendDMMessage,
  wait,
} = require("../discord/utils.js");

const { getMarketData, getPlayerInventory } = require("../data/getters.js");

const NotificationsDB = require("../models/notification.js");
const UsersDB = require("../models/user.js");

// ============================================================
// Utils
// ============================================================

/**
 * Convert a value to a boolean.
 *
 * @param {*} value
 * @returns {boolean}
 */
function toBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (
      normalized === "" ||
      normalized === "false" ||
      normalized === "0" ||
      normalized === "null" ||
      normalized === "undefined" ||
      normalized === "no"
    ) {
      return false;
    }

    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
  }

  return Boolean(value);
}

/**
 * Convert a value to a number.
 *
 * @param {*} value
 * @returns {number}
 */
function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

/**
 * Replace spaces with underscores.
 *
 * This is used by notification field placeholders.
 *
 * Example:
 *
 * "New York" -> "New_York"
 *
 * Case is preserved.
 *
 * @param {*} value
 * @returns {string}
 */
function fieldReferenceName(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/ /g, "_");
}

/**
 * Build the public placeholder path represented by a field node.
 *
 * Example:
 *
 * field.path:
 * [
 *   "town_X",
 *   "market",
 *   "product_X",
 *   "price"
 * ]
 *
 * reference:
 * {
 *   townName: "Schönwend",
 *   productName: "labour"
 * }
 *
 * returns:
 *
 * "Schönwend.market.labour.price"
 *
 * @param {Object} node
 * @returns {string|null}
 */
function getFieldPlaceholder(node) {
  if (!node || node.type !== "field") {
    return null;
  }

  const field = node.data?.field;

  if (!field || !Array.isArray(field.path)) {
    return null;
  }

  const reference = field.reference ?? {};

  const parts = field.path.map((part) => {
    if (part === "town_X") {
      return fieldReferenceName(reference.townName);
    }

    if (part === "product_X") {
      return fieldReferenceName(reference.productName);
    }

    if (part === "building_X") {
      return fieldReferenceName(reference.buildingName);
    }

    if (part === "buildingType_X") {
      return fieldReferenceName(reference.buildingType);
    }

    return String(part);
  });

  /*
   * If one of the required references is empty, the field
   * does not have a valid public placeholder.
   */
  if (parts.some((part) => part === "")) {
    return null;
  }

  return parts.join(".");
}

/**
 * Find the field node represented by a placeholder.
 *
 * The placeholder does NOT contain a node ID.
 *
 * Example:
 *
 * "{Schönwend.market.labour.price}"
 *
 * matches a field node whose internal path is:
 *
 * [
 *   "town_X",
 *   "market",
 *   "product_X",
 *   "price"
 * ]
 *
 * and whose references are:
 *
 * townName = "Schönwend"
 * productName = "labour"
 *
 * @param {string} placeholder
 * @param {Array<Object>} nodes
 * @returns {Object|null}
 */
function findFieldNodeForPlaceholder(placeholder, nodes) {
  if (typeof placeholder !== "string" || !Array.isArray(nodes)) {
    return null;
  }

  const placeholderPath =
    placeholder.startsWith("{") && placeholder.endsWith("}")
      ? placeholder.slice(1, -1)
      : placeholder;

  if (!placeholderPath) {
    return null;
  }

  for (const node of nodes) {
    if (node?.type !== "field") {
      continue;
    }

    const fieldPlaceholder = getFieldPlaceholder(node);

    if (fieldPlaceholder === placeholderPath) {
      return node;
    }
  }

  return null;
}

/**
 * Get the output value from a data node.
 *
 * @param {Object} nodeData node object
 * @returns {Promise<number|string|boolean|null>}
 */
async function getDataValue(nodeData) {
  if (!nodeData) {
    return 0;
  }

  switch (nodeData.type) {
    case "value":
      return nodeData?.data?.value ?? 0;

    case "field": {
      const field = nodeData?.data?.field;

      // console.log(`[Notifications] Field node details:`, field);

      if (!field) {
        return 0;
      }

      /*
       * Market fields.
       *
       * Example:
       *
       * [
       *   "town_X",
       *   "market",
       *   "product_X",
       *   "price"
       * ]
       */
      if (
        field.fieldType === "number" &&
        field.reference?.entityType === "town" &&
        field.path?.includes("market")
      ) {
        const towns = await getMarketData();

        // console.log(`[Notifications] Loaded market data:`, Array.from(towns.keys()));

        const town = towns?.get(field.reference?.townName.toLowerCase());

        // console.log(`[Notifications] Town for field node:`, town);

        const productName = field.reference?.productName;

        // console.log(
        //   `[Notifications] Product name for field node:`,
        //   productName,
        // );

        const productMarket = town?.markets?.[productName];

        const fieldName = field.path?.[field.path.length - 1];

        // console.log(
        //   `[Notifications] Product market for field node:`,
        //   productMarket,
        // );

        const value = productMarket?.[fieldName];

        // console.log(`[Notifications] Raw value for field node:`, value);

        const finalValue = Number.parseFloat(value);

        // console.log(`[Notifications] Final value for field node:`, finalValue);

        return Number.isFinite(finalValue) ? finalValue : 0;
      }

      /*
       * String market fields.
       */
      if (
        field.fieldType === "string" &&
        field.reference?.entityType === "town" &&
        field.path?.includes("market")
      ) {
        const towns = await getMarketData();

        const town = towns?.get(field.reference?.townName.toLowerCase());

        const productName = field.reference?.productName;

        const productMarket = town?.markets?.[productName];

        const fieldName = field.path?.[field.path.length - 1];

        return productMarket?.[fieldName] ?? "";
      }

      /*
       * Generic fallback.
       */
      return (
        nodeData?.data?.value ??
        nodeData?.data?.output ??
        nodeData?.data?.fieldText ??
        0
      );
    }

    default:
      return (
        nodeData?.data?.value ??
        nodeData?.data?.output ??
        nodeData?.data?.fieldText ??
        0
      );
  }
}

/**
 * Get the incoming edges for a node.
 *
 * @param {Object} node
 * @param {Array<Object>} edges
 * @returns {Array<Object>}
 */
function getIncomingEdges(node, edges) {
  return edges.filter((edge) => edge.target === node.id);
}

/**
 * Get the value coming into a specific handle.
 *
 * @param {Object} node
 * @param {string} handle
 * @param {Array<Object>} edges
 * @param {Map<string,Object>} nodesById
 * @param {Map<string,Promise<*>>} evaluationCache
 * @returns {Promise<*>}
 */
async function getInputValue(node, handle, edges, nodesById, evaluationCache) {
  const edge = edges.find(
    (edge) => edge.target === node.id && edge.targetHandle === handle,
  );

  if (!edge) {
    return 0;
  }

  const sourceNode = nodesById.get(edge.source);

  if (!sourceNode) {
    return 0;
  }

  return evaluateNode(sourceNode, edges, nodesById, evaluationCache);
}

/**
 * Get all values connected to a node.
 *
 * The order follows the input handles:
 *
 * input-0
 * input-1
 * input-2
 * ...
 *
 * @param {Object} node
 * @param {Array<Object>} edges
 * @param {Map<string,Object>} nodesById
 * @param {Map<string,Promise<*>>} evaluationCache
 * @returns {Promise<Array>}
 */
async function getInputValues(node, edges, nodesById, evaluationCache) {
  const incomingEdges = getIncomingEdges(node, edges);

  if (incomingEdges.length === 0) {
    return [];
  }

  const sortedEdges = [...incomingEdges].sort((a, b) => {
    const aHandle = a.targetHandle ?? "";

    const bHandle = b.targetHandle ?? "";

    const aNumber = Number.parseInt(aHandle.replace(/\D/g, ""), 10);

    const bNumber = Number.parseInt(bHandle.replace(/\D/g, ""), 10);

    if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
      return aNumber - bNumber;
    }

    return aHandle.localeCompare(bHandle);
  });

  return Promise.all(
    sortedEdges.map(async (edge) => {
      const sourceNode = nodesById.get(edge.source);

      if (!sourceNode) {
        return 0;
      }

      return evaluateNode(sourceNode, edges, nodesById, evaluationCache);
    }),
  );
}

/**
 * Evaluate a notification node.
 *
 * @param {Object} node
 * @param {Array<Object>} edges
 * @param {Map<string,Object>} nodesById
 * @param {Map<string,Promise<*>>} evaluationCache
 * @returns {Promise<*>}
 */
async function evaluateNode(node, edges, nodesById, evaluationCache) {
  if (!node) {
    return 0;
  }

  if (evaluationCache.has(node.id)) {
    const cachedValue = evaluationCache.get(node.id);
    // console.log(
    //   `[Notifications] Returning cached value for node "${node.id}" of type "${node.type}":`,
    //   cachedValue,
    // );
    return cachedValue;
  }

  const promise = (async () => {
    // console.log(
    //   `[Notifications] Starting evaluation for node "${node.id}" of type "${node.type}"`,
    // );
    // console.log(`[Notifications] Node details:`, node);
    switch (node.type) {
      // ====================================================
      // DATA
      // ====================================================

      case "field":
      case "value":
        const value = await getDataValue(node);
        // console.log(
        //   `[Notifications] Evaluating data node "${node.id}" of type "${node.type}" with value:`,
        //   value,
        // );
        return value;

      // ====================================================
      // LOGIC
      // ====================================================

      case "compare": {
        const left = await getInputValue(
          node,
          "left",
          edges,
          nodesById,
          evaluationCache,
        );

        const right = await getInputValue(
          node,
          "right",
          edges,
          nodesById,
          evaluationCache,
        );

        switch (node.data?.operator) {
          case ">":
            return left > right;

          case ">=":
            return left >= right;

          case "<":
            return left < right;

          case "<=":
            return left <= right;

          case "==":
          case "=":
            return left == right;

          case "===":
            return left === right;

          case "!=":
            return left != right;

          case "!==":
            return left !== right;

          default:
            return false;
        }
      }

      // ====================================================
      // GATES
      // ====================================================

      case "and": {
        const values = await getInputValues(
          node,
          edges,
          nodesById,
          evaluationCache,
        );

        return values.every(toBoolean);
      }

      case "or": {
        const values = await getInputValues(
          node,
          edges,
          nodesById,
          evaluationCache,
        );

        return values.some(toBoolean);
      }

      case "xor": {
        const values = await getInputValues(
          node,
          edges,
          nodesById,
          evaluationCache,
        );

        return values.filter(toBoolean).length === 1;
      }

      case "not": {
        const value = await getInputValue(
          node,
          "input",
          edges,
          nodesById,
          evaluationCache,
        );

        return !toBoolean(value);
      }

      // ====================================================
      // MATH - BINARY
      // ====================================================

      case "add": {
        const left = toNumber(
          await getInputValue(node, "left", edges, nodesById, evaluationCache),
        );

        const right = toNumber(
          await getInputValue(node, "right", edges, nodesById, evaluationCache),
        );

        return left + right;
      }

      case "subtract": {
        const left = toNumber(
          await getInputValue(node, "left", edges, nodesById, evaluationCache),
        );

        const right = toNumber(
          await getInputValue(node, "right", edges, nodesById, evaluationCache),
        );

        return left - right;
      }

      case "multiply": {
        const left = toNumber(
          await getInputValue(node, "left", edges, nodesById, evaluationCache),
        );

        const right = toNumber(
          await getInputValue(node, "right", edges, nodesById, evaluationCache),
        );

        return left * right;
      }

      case "divide": {
        const left = toNumber(
          await getInputValue(node, "left", edges, nodesById, evaluationCache),
        );

        const right = toNumber(
          await getInputValue(node, "right", edges, nodesById, evaluationCache),
        );

        if (right === 0) {
          return null;
        }

        return left / right;
      }

      case "modulo": {
        const left = toNumber(
          await getInputValue(node, "left", edges, nodesById, evaluationCache),
        );

        const right = toNumber(
          await getInputValue(node, "right", edges, nodesById, evaluationCache),
        );

        if (right === 0) {
          return null;
        }

        return left % right;
      }

      // ====================================================
      // MATH - MULTI INPUT
      // ====================================================

      case "min": {
        const values = await getInputValues(
          node,
          edges,
          nodesById,
          evaluationCache,
        );

        if (values.length === 0) {
          return null;
        }

        return Math.min(...values.map(toNumber));
      }

      case "max": {
        const values = await getInputValues(
          node,
          edges,
          nodesById,
          evaluationCache,
        );

        if (values.length === 0) {
          return null;
        }

        return Math.max(...values.map(toNumber));
      }

      // ====================================================
      // MATH - UNARY
      // ====================================================

      case "round": {
        const input = toNumber(
          await getInputValue(node, "input", edges, nodesById, evaluationCache),
        );

        return Math.round(input);
      }

      case "floor": {
        const input = toNumber(
          await getInputValue(node, "input", edges, nodesById, evaluationCache),
        );

        return Math.floor(input);
      }

      case "ceil": {
        const input = toNumber(
          await getInputValue(node, "input", edges, nodesById, evaluationCache),
        );

        return Math.ceil(input);
      }

      // ====================================================
      // ACTIONS
      // ====================================================

      case "discord":
      case "webhook":
        return null;

      default:
        console.warn(
          `[Notifications] Unknown node type "${node.type}" in node "${node.id}".`,
        );

        return 0;
    }
  })();

  evaluationCache.set(node.id, promise);

  return promise;
}

/**
 * Replace notification placeholders with evaluated field values.
 *
 * Placeholder format:
 *
 *   {Schönwend.market.labour.price}
 *
 * It corresponds to a field node such as:
 *
 *   {
 *     "path": [
 *       "town_X",
 *       "market",
 *       "product_X",
 *       "price"
 *     ],
 *     "reference": {
 *       "townName": "Schönwend",
 *       "productName": "labour"
 *     }
 *   }
 *
 * Spaces in town/product/building names are replaced with "_".
 * Case is preserved.
 *
 * @param {string} message
 * @param {Object} node
 * @param {Array<Object>} nodes
 * @param {Array<Object>} edges
 * @param {Map<string,Object>} nodesById
 * @param {Map<string,Promise<*>>} evaluationCache
 * @returns {Promise<string>}
 */
async function replacePlaceholders(
  message,
  node,
  nodes,
  edges,
  nodesById,
  evaluationCache,
) {
  if (typeof message !== "string") {
    return "";
  }

  const placeholders = node.data?.placeholders ?? [];

  if (!Array.isArray(placeholders)) {
    return message;
  }

  let result = message;

  for (const placeholder of placeholders) {
    if (!placeholder || typeof placeholder !== "string") {
      continue;
    }

    /*
     * Find the field node represented by
     * this placeholder.
     */
    const fieldNode = findFieldNodeForPlaceholder(placeholder, nodes);

    if (!fieldNode) {
      console.warn(
        `[Notifications] Could not find field node for placeholder "${placeholder}" in notification.`,
      );

      continue;
    }

    /*
     * Evaluate the actual field node.
     *
     * This means the placeholder gets exactly
     * the same value that the field node produces
     * when used in the notification graph.
     */
    const value = await evaluateNode(
      fieldNode,
      edges,
      nodesById,
      evaluationCache,
    );

    const replacement =
      value === null || value === undefined ? "" : String(value);

    /*
     * Replace every occurrence of
     * this exact placeholder.
     */
    result = result.split(placeholder).join(replacement);
  }

  return result;
}

/**
 * Execute a Discord action node.
 *
 * @param {import("discord.js").Client} client
 * @param {Object} notification
 * @param {Object} user
 * @param {Object} node
 * @param {Array<Object>} nodes
 * @param {Array<Object>} edges
 * @param {Map<string,Object>} nodesById
 * @param {Map<string,Promise<*>>} evaluationCache
 */
async function executeDiscordNode(
  client,
  notification,
  user,
  node,
  nodes,
  edges,
  nodesById,
  evaluationCache,
) {
  const incomingEdges = getIncomingEdges(node, edges);

  /*
   * Discord requires at least one
   * condition/input.
   */
  if (incomingEdges.length === 0) {
    return;
  }

  const inputValues = await Promise.all(
    incomingEdges.map(async (edge) => {
      const sourceNode = nodesById.get(edge.source);

      if (!sourceNode) {
        return false;
      }

      return evaluateNode(sourceNode, edges, nodesById, evaluationCache);
    }),
  );

  // console.log(
  //   `[Notifications] Input values for Discord node "${node.id}":`,
  //   inputValues,
  // );

  /*
   * Every incoming condition must
   * evaluate to true.
   */
  const shouldSend = inputValues.every(toBoolean);
  // console.log(
  //   `[Notifications] Should send Discord node "${node.id}":`,
  //   shouldSend,
  // );

  if (!shouldSend) {
    return;
  }

  const message = await replacePlaceholders(
    node.data?.message ?? "",
    node,
    nodes,
    edges,
    nodesById,
    evaluationCache,
  );

  if (!message) {
    console.warn(
      `[Notifications] Discord node "${node.id}" in notification "${notification.name}" has an empty message.`,
    );

    return;
  }

  const discordId = user?.discord?.id;

  if (!discordId) {
    console.warn(
      `[Notifications] User "${user?._id}" has no linked Discord account.`,
    );

    return;
  }

  if (user?.settings?.notifications?.discord === false) {
    return;
  }

  // console.log(
  //   `[Notifications] Sending Discord message to user "${user?._id}" with content:`,
  //   message,
  // );
  sendDMMessage(client, discordId, message);
}

/**
 * Execute a webhook action node.
 *
 * @param {Object} notification
 * @param {Object} node
 * @param {Array<Object>} nodes
 * @param {Array<Object>} edges
 * @param {Map<string,Object>} nodesById
 * @param {Map<string,Promise<*>>} evaluationCache
 */
async function executeWebhookNode(
  notification,
  node,
  nodes,
  edges,
  nodesById,
  evaluationCache,
) {
  const incomingEdges = getIncomingEdges(node, edges);

  if (incomingEdges.length === 0) {
    return;
  }

  const inputValues = await Promise.all(
    incomingEdges.map(async (edge) => {
      const sourceNode = nodesById.get(edge.source);

      if (!sourceNode) {
        return false;
      }

      return evaluateNode(sourceNode, edges, nodesById, evaluationCache);
    }),
  );

  const shouldSend = inputValues.every(toBoolean);

  if (!shouldSend) {
    return;
  }

  const url = node.data?.url;

  if (!url) {
    console.warn(
      `[Notifications] Webhook node "${node.id}" in notification "${notification.name}" has no URL.`,
    );

    return;
  }

  const method = (node.data?.method ?? "POST").toUpperCase();

  let body = node.data?.body ?? "";

  if (typeof body === "string") {
    body = await replacePlaceholders(
      body,
      node,
      nodes,
      edges,
      nodesById,
      evaluationCache,
    );
  }

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (method !== "GET" && method !== "HEAD") {
    options.body = body;
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      console.error(
        `[Notifications] Webhook "${notification.name}" returned HTTP ${response.status}.`,
      );
    }
  } catch (error) {
    console.error(
      `[Notifications] Error executing webhook "${notification.name}":`,
      error,
    );
  }
}

/**
 * Execute all action nodes in a notification.
 *
 * @param {import("discord.js").Client} client
 * @param {Object} notification
 * @param {Object} user
 */
async function executeNotification(client, notification, user) {
  const nodes = notification.nodes ?? [];

  const edges = notification.edges ?? [];

  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  const evaluationCache = new Map();

  const actionNodes = nodes.filter(
    (node) => node.type === "discord" || node.type === "webhook",
  );

  for (const node of actionNodes) {
    try {
      if (node.type === "discord") {
        await executeDiscordNode(
          client,
          notification,
          user,
          node,
          nodes,
          edges,
          nodesById,
          evaluationCache,
        );
      } else if (node.type === "webhook") {
        await executeWebhookNode(
          notification,
          node,
          nodes,
          edges,
          nodesById,
          evaluationCache,
        );
      }
    } catch (error) {
      console.error(
        `[Notifications] Error executing node "${node.id}" in notification "${notification.name}":`,
        error,
      );
    }
  }
}

/**
 * Find and send all enabled notifications.
 *
 * @param {import("discord.js").Client} client
 * @param {string} period
 * @param {boolean} periodSend
 */
async function sendNotifications(client, period, periodSend) {
  /*
   * Only process notifications at
   * their configured send times.
   */
  if (!periodSend) {
    return;
  }

  let notifications;

  try {
    /*
     * IMPORTANT:
     *
     * Disabled notifications are never loaded.
     * Therefore their nodes are never evaluated.
     */
    notifications = await NotificationsDB.find({
      enabled: true,
    }).lean();

    // console.log(
    //   `[Notifications] Loaded ${notifications.length} enabled notifications.`,
    // );
  } catch (error) {
    console.error(
      "[Notifications] Failed to load enabled notifications:",
      error,
    );

    return;
  }

  if (!notifications.length) {
    return;
  }

  const userIds = [
    ...new Set(
      notifications
        .map((notification) => notification.user?.toString())
        .filter(Boolean),
    ),
  ];

  // console.log(
  //   `[Notifications] Found ${userIds.length} unique users for notifications.`,
  // );

  if (!userIds.length) {
    return;
  }

  let users;

  try {
    users = await UsersDB.find({
      _id: {
        $in: userIds,
      },
    }).lean();
  } catch (error) {
    console.error("[Notifications] Failed to load notification users:", error);

    return;
  }

  // console.log(
  //   `[Notifications] Loaded ${users.length} users for notifications.`,
  // );

  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  for (const notification of notifications) {
    const userId = notification.user?.toString();

    const user = usersById.get(userId);

    if (!user) {
      console.warn(
        `[Notifications] User "${userId}" not found for notification "${notification.name}".`,
      );

      continue;
    }

    try {
      await executeNotification(client, notification, user);
    } catch (error) {
      console.error(
        `[Notifications] Error processing notification "${notification.name}" (${notification._id}):`,
        error,
      );
    }
  }
}

// ============================================================
// Routine
// ============================================================

/**
 * @param {import("discord.js").Client} client
 */
async function routine(client) {
  while (true) {
    const now = new Date();
    const minutes = now.getMinutes();

    let period = null;
    let periodSend = false;

    if (minutes < 15) {
      period = "early";

      if (minutes === 10) {
        periodSend = true;
      }
    } else if (minutes < 40) {
      period = "mid";

      if (minutes === 30) {
        periodSend = true;
      }
    } else {
      period = "late";

      if (minutes === 50) {
        periodSend = true;
      }
    }

    try {
      await sendNotifications(client, period, periodSend);
    } catch (error) {
      console.error("[Notifications] Routine error:", error);
    }

    const current = new Date();

    await wait((5 - (current.getMinutes() % 5)) * 60 - current.getSeconds());
  }
}

module.exports = routine;
