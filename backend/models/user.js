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
  { _id: false, timestamps: true },
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

        ret.apiKeys = ret.apiKeys.map((apiKey) => {
          var apiKeyJson = apiKey.toObject();

          apiKeyJson.key =
            apiKeyJson.key?.substring(0, 4) +
            "********" +
            apiKeyJson.key?.substring(apiKeyJson.key?.length - 4);

          return apiKeyJson;
        });
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.discordLinkCode;
        delete ret.discordLinkCodeExpiresAt;

        ret.email = ret.email?.substring(0, 4) + "**************";

        ret.apiKeys = ret.apiKeys.map((apiKey) => {
          var apiKeyJson = apiKey.toObject();

          apiKeyJson.key =
            apiKeyJson.key?.substring(0, 4) +
            "********" +
            apiKeyJson.key?.substring(apiKeyJson.key?.length - 4);

          return apiKeyJson;
        });

        return ret;
      },
    },
  },
);

module.exports = mongoose.model("User", UserSchema);
