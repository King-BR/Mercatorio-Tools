const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const ApiKeySchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    keyType: {
      type: String,
      required: true,
      enum: ["MERCTOOLS", "GAME"],
    },
    permissions: {
      type: [String],
      default: ["READ"],
      enum: ["READ", "WRITE", "ADMIN"],
    },
  },
  {
    _id: false,
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.key =
          ret.key?.substring(0, 4) +
          "********" +
          ret.key?.substring(ret.key?.length - 4);

        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        ret.key =
          ret.key?.substring(0, ret.key?.startsWith("MTKEY-") ? 10 : 4) +
          "********" +
          ret.key?.substring(ret.key?.length - 4);

        return ret;
      },
    },
  },
);

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: { type: String, required: true },
    discordID: { type: String, required: false },
    discordLinkCode: {
      type: String,
      default: null,
    },
    discordLinkCodeExpiresAt: {
      type: Date,
      default: null,
    },
    apiKeys: { type: [ApiKeySchema], default: [] },
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
        delete ret.discordLinkCode;
        delete ret.discordLinkCodeExpiresAt;

        ret.email = ret.email?.substring(0, 4) + "**************";

        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.discordLinkCode;
        delete ret.discordLinkCodeExpiresAt;

        ret.email = ret.email?.substring(0, 4) + "**************";

        return ret;
      },
    },
  },
);

module.exports = mongoose.model("User", UserSchema);
