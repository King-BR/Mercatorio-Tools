const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const ApiKeySchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    keyType: {
      type: String,
      required: true,
      enum: ["merctools", "game"],
    },
    permissions: {
      type: [String],
      default: ["read"],
      enum: ["read", "write", "admin"],
    },
  },
  { _id: false, timestamps: true },
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    discordID: { type: String, required: false },
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
