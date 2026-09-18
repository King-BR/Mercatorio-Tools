const express = require("express");

const { client } = require("../discord/index.js");
const config = require("../discord/config.json");
const utils = require("../discord/utils.js");

const Notification = require("../models/notification");
const Users = require("../models/user");
const auth = require("../middleware/auth");
const fieldsDefinition = require("../data/fields");

const router = express.Router();

/*
 * ==========================================
 * HELPERS
 * ==========================================
 */

function sanitizeNotification(notification) {
  return {
    _id: notification._id,
    name: notification.name,
    description: notification.description,
    enabled: notification.enabled,
    nodes: notification.nodes,
    edges: notification.edges,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}

function validateWorkflow(nodes, edges) {
  if (!Array.isArray(nodes)) {
    return "nodes must be an array.";
  }

  if (!Array.isArray(edges)) {
    return "edges must be an array.";
  }

  const nodeIds = new Set();

  for (const node of nodes) {
    if (!node?.id || typeof node.id !== "string") {
      return "Every node must have a valid id.";
    }

    if (nodeIds.has(node.id)) {
      return `Duplicate node id: ${node.id}`;
    }

    nodeIds.add(node.id);

    if (
      !node.position ||
      typeof node.position.x !== "number" ||
      typeof node.position.y !== "number"
    ) {
      return `Node "${node.id}" has an invalid position.`;
    }

    if (
      ![
        "field",
        "value",
        "condition",
        "compare",
        "discord",
        "webhook",
      ].includes(node.type)
    ) {
      return `Unknown node type "${node.type}".`;
    }
  }

  for (const edge of edges) {
    if (!edge?.id) {
      return "Every edge must have an id.";
    }

    if (!nodeIds.has(edge.source)) {
      return `Edge "${edge.id}" references an unknown source node.`;
    }

    if (!nodeIds.has(edge.target)) {
      return `Edge "${edge.id}" references an unknown target node.`;
    }
  }

  return null;
}

/*
 * ==========================================
 * GET FIELD DEFINITIONS
 * ==========================================
 *
 * GET /api/notifications/fields
 *
 * The frontend uses this instead of duplicating
 * fields.js.
 */

router.get("/fields", auth, async (req, res) => {
  try {
    res.json(fieldsDefinition);
  } catch (error) {
    console.error("Failed to get fields definition:", error);

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting fields definition: ${error.message}`,
    );

    res.status(500).json({
      message: "Failed to get fields definition.",
    });
  }
});

/*
 * ==========================================
 * GET ALL NOTIFICATIONS
 * ==========================================
 */

router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
    }).sort({
      updatedAt: -1,
    });

    res.json({
      notifications: notifications.map(sanitizeNotification),
    });
  } catch (error) {
    console.error("Failed to get notifications:", error);

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting notifications: ${error.message}`,
    );

    res.status(500).json({
      message: "Failed to load notifications.",
    });
  }
});

/*
 * ==========================================
 * GET ONE NOTIFICATION
 * ==========================================
 */

router.get("/:id", auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    res.json({
      notification: sanitizeNotification(notification),
    });
  } catch (error) {
    console.error("Failed to get notification:", error);

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting notification ${req.params.id}: ${error.message}`,
    );

    res.status(500).json({
      message: "Failed to load notification.",
    });
  }
});

/*
 * ==========================================
 * CREATE
 * ==========================================
 */

router.post("/", auth, async (req, res) => {
  try {
    const {
      name,
      description = "",
      enabled = false,
      nodes = [],
      edges = [],
    } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Notification name is required.",
      });
    }

    const workflowError = validateWorkflow(nodes, edges);

    if (workflowError) {
      return res.status(400).json({
        message: workflowError,
      });
    }

    const notification = await Notification.create({
      user: req.user._id,
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      enabled: Boolean(enabled),
      nodes,
      edges,
    });

    await Users.findByIdAndUpdate(req.user._id, {
      $addToSet: {
        notifications: notification._id,
      },
    });

    res.status(201).json({
      notification: sanitizeNotification(notification),
    });
  } catch (error) {
    console.error("Failed to create notification:", error);

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error creating notification: ${error.message}`,
    );

    res.status(500).json({
      message: "Failed to create notification.",
    });
  }
});

/*
 * ==========================================
 * UPDATE
 * ==========================================
 */

router.patch("/:id", auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== "string" || !req.body.name.trim()) {
        return res.status(400).json({
          message: "Notification name cannot be empty.",
        });
      }

      notification.name = req.body.name.trim();
    }

    if (req.body.description !== undefined) {
      notification.description =
        typeof req.body.description === "string"
          ? req.body.description.trim()
          : "";
    }

    if (req.body.enabled !== undefined) {
      notification.enabled = Boolean(req.body.enabled);
    }

    if (req.body.nodes !== undefined || req.body.edges !== undefined) {
      const nodes = req.body.nodes ?? notification.nodes;

      const edges = req.body.edges ?? notification.edges;

      const workflowError = validateWorkflow(nodes, edges);

      if (workflowError) {
        return res.status(400).json({
          message: workflowError,
        });
      }

      notification.nodes = nodes;
      notification.edges = edges;
    }

    await notification.save();

    res.json({
      notification: sanitizeNotification(notification),
    });
  } catch (error) {
    console.error("Failed to update notification:", error);

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error updating notification ${req.params.id}: ${error.message}`,
    );

    res.status(500).json({
      message: "Failed to update notification.",
    });
  }
});

/*
 * ==========================================
 * DELETE
 * ==========================================
 */

router.delete("/:id", auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    await Notification.deleteOne({
      _id: notification._id,
    });

    await Users.findByIdAndUpdate(req.user._id, {
      $pull: {
        notifications: notification._id,
      },
    });

    res.json({
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete notification:", error);

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error deleting notification ${req.params.id}: ${error.message}`,
    );

    res.status(500).json({
      message: "Failed to delete notification.",
    });
  }
});

/*
 * ==========================================
 * DUPLICATE
 * ==========================================
 */

router.post("/:id/duplicate", auth, async (req, res) => {
  try {
    const original = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!original) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    const duplicate = await Notification.create({
      user: req.user._id,
      name: `${original.name} (Copy)`,
      description: original.description,
      enabled: false,
      nodes: original.nodes.map((node) => ({
        ...node.toObject(),
      })),
      edges: original.edges.map((edge) => ({
        ...edge.toObject(),
      })),
    });

    await Users.findByIdAndUpdate(req.user._id, {
      $addToSet: {
        notifications: duplicate._id,
      },
    });

    res.status(201).json({
      notification: sanitizeNotification(duplicate),
    });
  } catch (error) {
    console.error("Failed to duplicate notification:", error);

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error duplicating notification ${req.params.id}: ${error.message}`,
    );

    res.status(500).json({
      message: "Failed to duplicate notification.",
    });
  }
});

module.exports = router;
