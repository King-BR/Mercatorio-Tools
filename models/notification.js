const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const productsEnum = require("../data/products.json");

const NotificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    data: {
      type: {
        type: String,
        required: true,
        enum: ["price", "stock", "expiry", "bought", "sold", "produced"],
      },
      product: {
        type: String,
        required: true,
        enum: productsEnum,
      },
      comparison: {
        type: String,
        required: true,
        enum: ["<=", ">=", "<", ">", "==", "!="],
      },
      number: {
        type: Number,
        required: true,
      },
    },
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
  }
);

module.exports = mongoose.model("Notification", NotificationSchema);
