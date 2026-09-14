const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const DiscordDataSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      default: null,
    },
    globalName: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  {
    _id: false,
    timestamps: true,
  },
);

const ApiKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    mercUser: {
      type: String,
      required: function () {
        return this.keyType === "GAME";
      },
    },
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
    timestamps: true,

    toJSON: {
      transform: function (doc, ret) {
        if (ret.key) {
          const prefixLength = ret.key.startsWith("MTKEY-") ? 10 : 4;

          ret.key =
            ret.key.substring(0, prefixLength) +
            "**************" +
            ret.key.substring(ret.key.length - 4);
        }

        return ret;
      },
    },

    toObject: {
      transform: function (doc, ret) {
        if (ret.key) {
          const prefixLength = ret.key.startsWith("MTKEY-") ? 10 : 4;

          ret.key =
            ret.key.substring(0, prefixLength) +
            "**************" +
            ret.key.substring(ret.key.length - 4);
        }

        return ret;
      },
    },
  },
);

const UserSchema = new mongoose.Schema(
  {
    /*
     * Discord is now the identity of the account.
     */
    discord: {
      type: DiscordDataSchema,
      required: true,
    },

    apiKeys: {
      type: [ApiKeySchema],
      default: [],
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    notifications: [
      {
        type: ObjectId,
      },
    ],

    settings: {
      theme: {
        type: String,
        default: "dark",
      },

      notifications: {
        discord: {
          type: Boolean,
          default: false,
        },
      },
    },
  },
  {
    collection: "Users-merc_tools",
    timestamps: true,

    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;

        return ret;
      },
    },

    toObject: {
      transform: function (doc, ret) {
        delete ret.password;

        return ret;
      },
    },
  },
);

/*
 * Discord IDs must uniquely identify a Mercatorio Tools account.
 */
UserSchema.index(
  { "discord.id": 1 },
  {
    unique: true,
    sparse: true,
  },
);

module.exports = mongoose.model("User", UserSchema);
