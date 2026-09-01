const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    discordID: { type: String, required: false },
    apiKey: { type: String, required: false },
    isAdmin: { type: Boolean, default: false },
    notifications: [{ type: ObjectId }],
    settings: {
      theme: { type: String, default: "dark" },
      notifications: {
        email: { type: Boolean, default: false },
        discord: { type: Boolean, default: false },
      },
    },
  },
  {
    collection: "Users-merc_tools",
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("User", UserSchema);
