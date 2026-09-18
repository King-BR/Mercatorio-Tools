const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema.Types;

const NotificationNodeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["field", "value", "condition", "compare", "discord", "webhook"],
    },

    position: {
      x: {
        type: Number,
        required: true,
      },
      y: {
        type: Number,
        required: true,
      },
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    _id: false,
  },
);

const NotificationEdgeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    source: {
      type: String,
      required: true,
    },

    target: {
      type: String,
      required: true,
    },

    sourceHandle: {
      type: String,
      default: null,
    },

    targetHandle: {
      type: String,
      default: null,
    },

    type: {
      type: String,
      default: "smoothstep",
    },

    animated: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    enabled: {
      type: Boolean,
      default: false,
    },

    nodes: {
      type: [NotificationNodeSchema],
      default: [],
    },

    edges: {
      type: [NotificationEdgeSchema],
      default: [],
    },
  },
  {
    collection: "Notifications-merc_tools",
    timestamps: true,
  },
);

module.exports = mongoose.model("Notifications", NotificationSchema);
