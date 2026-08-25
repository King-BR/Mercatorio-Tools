const mongoose = require("mongoose");
const { ObjectId, Union } = mongoose.Schema.Types;
const {
  operators: { all: operatorsEnum },
} = require("../data/fields.js");

const ConditionSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true,
  },
  operator: {
    type: String,
    required: true,
    enum: operatorsEnum,
  },
  valueType: {
    type: String,
    enum: ["constant", "field"],
    default: "constant",
  },
  value: {
    type: Union,
    of: [Number, Boolean, String],
  },
  aggregation: {
    type: String,
    enum: [null, "average", "min", "max", "sum", "count"],
    default: null,
  },
  timeWindow: {
    amount: Number,
    unit: {
      type: String,
      enum: ["hours", "days", "weeks", "months"],
    },
  },
});

const NotificationSchema = new mongoose.Schema(
  {
    _id: { type: ObjectId, auto: true },
    creatorId: { type: String, required: true },
    message: { type: String, required: true },
    period: {
      type: [String],
      enum: ["early", "mid", "late", "custom"],
      required: true,
    },
    minutes: {
      type: [Number],
      required: function () {
        return this.period.includes("custom");
      },
      validate: {
        validator: function (v) {
          return v.every((minute) => minute >= 5 && minute <= 59);
        },
        message: "Minutes must be between 5 and 59",
      },
    },
    conditions: {
      type: [ConditionSchema],
      required: true,
    },
    _createdAt: { type: Date, default: Date.now },
    _updatedAt: { type: Date, default: Date.now },
  },
  {
    collection: "Notifications-merc_tools",
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model("Notification", NotificationSchema);
