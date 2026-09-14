const express = require("express");
const crypto = require("crypto");

const UsersDB = require("../models/user");
const auth = require("../middleware/auth");

const router = express.Router();

const VALID_KEY_TYPES = ["GAME", "MERCTOOLS"];
const VALID_PERMISSIONS = ["READ", "WRITE", "ADMIN"];

function normalizePermissions(permissions) {
  if (!Array.isArray(permissions)) {
    return ["READ"];
  }

  const normalized = [
    ...new Set(
      permissions
        .map((permission) => String(permission).toUpperCase())
        .filter((permission) => VALID_PERMISSIONS.includes(permission)),
    ),
  ];

  return normalized.length > 0 ? normalized : ["READ"];
}

function generateMercToolsKey() {
  return `MTKEY-${crypto.randomBytes(24).toString("hex")}`;
}

function getKeyId(apiKey) {
  return apiKey?._id?.toString();
}

/*
 * GET /api/apiKeys
 *
 * Returns the authenticated user's API keys.
 *
 * Keys are serialized through the Mongoose schema, so the actual
 * secret values are never returned here.
 */
router.get("/", auth, async (req, res) => {
  try {
    const user = await UsersDB.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      apiKeys: user.apiKeys.map((apiKey) => apiKey.toJSON()),
    });
  } catch (error) {
    console.error("Get API keys error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

/*
 * POST /api/apiKeys/game
 *
 * Adds an API key belonging to the Mercatorio game.
 *
 * Body:
 * {
 *   "key": "...",
 *   "mercUser": "..."
 * }
 */
router.post("/game", auth, async (req, res) => {
  try {
    const key = typeof req.body.key === "string" ? req.body.key.trim() : "";

    const mercUser =
      typeof req.body.mercUser === "string" ? req.body.mercUser.trim() : "";

    const permissions = normalizePermissions(req.body.permissions);

    if (!key) {
      return res.status(400).json({
        message: "Game API key is required",
      });
    }

    if (!mercUser) {
      return res.status(400).json({
        message: "Mercatorio user is required",
      });
    }

    const user = await UsersDB.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const alreadyExists = user.apiKeys.some((apiKey) => apiKey.key === key);

    if (alreadyExists) {
      return res.status(409).json({
        message: "This API key is already registered",
      });
    }

    user.apiKeys.push({
      key,
      mercUser,
      keyType: "GAME",
      permissions,
    });

    await user.save();

    const createdKey = user.apiKeys[user.apiKeys.length - 1];

    return res.status(201).json({
      apiKey: createdKey.toJSON(),
    });
  } catch (error) {
    console.error("Add game API key error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

/*
 * POST /api/apiKeys/merctools
 *
 * Generates a new Mercatorio Tools API key.
 *
 * Body:
 * {
 *   "permissions": ["READ", "WRITE"]
 * }
 *
 * The complete key is returned ONLY when it is created.
 */
router.post("/merctools", auth, async (req, res) => {
  try {
    const user = await UsersDB.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const permissions = normalizePermissions(req.body.permissions);
    const key = generateMercToolsKey();

    user.apiKeys.push({
      key,
      keyType: "MERCTOOLS",
      permissions,
    });

    await user.save();

    const createdKey = user.apiKeys[user.apiKeys.length - 1];

    return res.status(201).json({
      apiKey: createdKey.toJSON(),

      /*
       * The secret is intentionally returned only during creation.
       */
      secret: key,
    });
  } catch (error) {
    console.error("Generate MercTools API key error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

/*
 * PATCH /api/apiKeys/:id
 *
 * Updates an existing API key.
 *
 * GAME:
 * {
 *   "key": "...",        // optional
 *   "mercUser": "..."
 * }
 *
 * MERCTOOLS:
 * {
 *   "permissions": ["READ", "WRITE"]
 * }
 *
 * keyType cannot be changed.
 */
router.patch("/:id", auth, async (req, res) => {
  try {
    const user = await UsersDB.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const apiKey = user.apiKeys.id(req.params.id);

    if (!apiKey) {
      return res.status(404).json({
        message: "API key not found",
      });
    }

    if (apiKey.keyType === "GAME") {
      if (req.body.mercUser !== undefined) {
        const mercUser =
          typeof req.body.mercUser === "string" ? req.body.mercUser.trim() : "";

        if (!mercUser) {
          return res.status(400).json({
            message: "Mercatorio user is required",
          });
        }

        apiKey.mercUser = mercUser;
      }

      if (req.body.key !== undefined) {
        const key = typeof req.body.key === "string" ? req.body.key.trim() : "";

        if (!key) {
          return res.status(400).json({
            message: "Game API key cannot be empty",
          });
        }

        const duplicate = user.apiKeys.some(
          (otherKey) =>
            otherKey._id.toString() !== apiKey._id.toString() &&
            otherKey.key === key,
        );

        if (duplicate) {
          return res.status(409).json({
            message: "This API key is already registered",
          });
        }

        apiKey.key = key;
      }
    }

    if (apiKey.keyType === "MERCTOOLS") {
      if (req.body.permissions !== undefined) {
        apiKey.permissions = normalizePermissions(req.body.permissions);
      }

      /*
       * MERCTOOLS secrets cannot be replaced through this endpoint.
       * Generate a new key instead.
       */
      if (req.body.key !== undefined) {
        return res.status(400).json({
          message:
            "Mercatorio Tools API keys cannot be changed. Generate a new key instead.",
        });
      }
    }

    await user.save();

    return res.json({
      apiKey: apiKey.toJSON(),
    });
  } catch (error) {
    console.error("Update API key error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

/*
 * DELETE /api/apiKeys/:id
 *
 * Revokes/removes an API key.
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const user = await UsersDB.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const apiKey = user.apiKeys.id(req.params.id);

    if (!apiKey) {
      return res.status(404).json({
        message: "API key not found",
      });
    }

    apiKey.deleteOne();

    await user.save();

    return res.json({
      message: "API key revoked successfully",
    });
  } catch (error) {
    console.error("Delete API key error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
