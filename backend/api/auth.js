const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UsersDB = require("../models/user");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const { client } = require("../discord/index.js");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

/*
 * ==========================================
 * AUTH COOKIE
 * ==========================================
 */
function setAuthCookie(res, user) {
  const token = jwt.sign(
    {
      user: {
        id: user._id.toString(),
      },
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/*
 * ==========================================
 * USER RESPONSE
 * ==========================================
 *
 * Ensures that only appropriate information
 * is sent to the frontend.
 */
function userResponse(user) {
  const data = user.toJSON();

  return data;
}

/*
 * ==========================================
 * REGISTER
 * ==========================================
 *
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    /*
     * Basic validation
     */
    if ((!email && !username) || !password) {
      return res.status(400).json({
        message: "Username/email and password are required",
      });
    }

    /*
     * Find the user
     */
    var existingUser = null;

    if (email) {
      existingUser = await UsersDB.findOne({
        email: email,
      });
    } else if (username) {
      existingUser = await UsersDB.findOne({
        username: username,
      });
    }

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email or username already exists",
      });
    }

    /*
     * Create the password hash
     */
    const passwordHash = await bcrypt.hash(password, 12);

    /*
     * Create the user
     */
    const user = new UsersDB({
      email: email ? email.trim().toLowerCase() : undefined,
      username: username ? username.trim() : undefined,
      password: passwordHash,
    });

    await user.save();

    /*
     * Automatically authenticate after registration
     */
    setAuthCookie(res, user);

    res.status(201).json({
      user: userResponse(user),
    });
  } catch (err) {
    console.error("Register error:", err);

    res.status(500).json({
      message: "Server error",
    });
  }
});

/*
 * ==========================================
 * LOGIN
 * ==========================================
 *
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    /*
     * Basic validation
     */
    if ((!email && !username) || !password) {
      return res.status(400).json({
        message: "Username/email and password are required",
      });
    }

    /*
     * Find the user
     */
    var user = null;

    if (email && email.trim() !== "") {
      user = await UsersDB.findOne({
        email: email.trim(),
      });
    } else if (username && username.trim() !== "") {
      user = await UsersDB.findOne({
        username: username.trim(),
      });
    }

    /*
     * Do not reveal if the username or email exists
     */
    if (!user) {
      return res.status(401).json({
        message: "Invalid username/email or password",
      });
    }

    /*
     * Verify password
     */
    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid username/email or password",
      });
    }

    /*
     * Create session
     */
    setAuthCookie(res, user);

    res.json({
      user: userResponse(user),
    });
  } catch (err) {
    console.error("Login error:", err);

    res.status(500).json({
      message: "Server error",
    });
  }
});

/*
 * ==========================================
 * LOGOUT
 * ==========================================
 *
 * POST /api/auth/logout
 */
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });

  res.json({
    message: "Logged out successfully",
  });
});

/*
 * ==========================================
 * CURRENT USER
 * ==========================================
 *
 * GET /api/auth/me
 *
 * Returns the authenticated user's data.
 */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await UsersDB.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user: userResponse(user),
    });
  } catch (err) {
    console.error("Get current user error:", err);

    res.status(500).json({
      message: "Server error",
    });
  }
});

/*
 * ==========================================
 * UPDATE CURRENT USER
 * ==========================================
 *
 * PATCH /api/auth/me
 *
 * Allowed fields:
 *
 * - email
 * - username
 * - discord.id
 * - discord.tag
 * - discord.avatar
 * - settings.notifications.email
 * - settings.notifications.discord
 */
router.patch("/me", auth, async (req, res) => {
  try {
    const { email, username, settings } = req.body;

    const user = await UsersDB.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    /*
     * Notification settings
     */
    if (settings?.notifications) {
      if (settings.notifications.email !== undefined) {
        user.settings.notifications.email = Boolean(
          settings.notifications.email,
        );
      }

      if (settings.notifications.discord !== undefined) {
        user.settings.notifications.discord = Boolean(
          settings.notifications.discord,
        );
      }
    }

    /*
     * Update email and username
     */
    if (email !== undefined) {
      UsersDB.findOne({ email }).then((existingUser) => {
        if (
          existingUser &&
          existingUser._id.toString() !== user._id.toString()
        ) {
          res.status(400).json({
            message: "Email already in use",
          });
          return;
        }
      });

      user.email = email;
    }

    if (username !== undefined) {
      UsersDB.findOne({ username }).then((existingUser) => {
        if (
          existingUser &&
          existingUser._id.toString() !== user._id.toString()
        ) {
          res.status(400).json({
            message: "Username already in use",
          });
          return;
        }
      });

      user.username = username;
    }

    /*
     * Save changes
     */
    await user.save();

    res.json({
      user: userResponse(user),
    });
  } catch (error) {
    console.error("Update account error:", error);

    res.status(500).json({
      message: "Server error",
      error,
    });
  }
});

/*
 * ==========================================
 * GET DISCORD USER
 * ==========================================
 *
 * GET /api/auth/discord/me
 *
 * Returns the authenticated user's Discord-linked data.
 */
router.get("/discord/me", auth, async (req, res) => {
  try {
    const discordUser = await client.users.fetch(req.user.discord.id);

    if (!discordUser) {
      return res.status(404).json({
        message: "Discord user not found",
      });
    }

    res.json({
      user: userResponse(req.user),
      discordUser: discordUser.toJSON(),
    });
  } catch (error) {
    console.error("Error getting Discord user: ", error);

    res.status(500).json({
      message: "Server error",
      error,
    });
  }
});

/*
 * ==========================================
 * GENERATE MERCTOOLS API KEY
 * ==========================================
 *
 * POST /api/auth/key/new
 *
 * Body parameters:
 * - permissions: An array of permissions for the API key (optional)
 */
router.post("/key/new", auth, async (req, res) => {
  try {
    const apiKey = "MTKEY-" + crypto.randomBytes(16).toString("hex");

    // Save the generated API key to the user's record
    const user = await UsersDB.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const perms = [];

    if (req.body.permissions && Array.isArray(req.body.permissions)) {
      perms.push(...req.body.permissions.map((p) => p.toUpperCase()));
    }

    if (perms.length === 0) {
      perms.push("READ");
    }

    user.apiKeys.push({
      key: apiKey,
      keyType: "MERCTOOLS",
      permissions: perms,
    });

    await user.save();

    res.json({
      apiKey,
    });
  } catch (err) {
    console.error("Generate MERCTOOLS API key error:", err);

    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
});

module.exports = router;
