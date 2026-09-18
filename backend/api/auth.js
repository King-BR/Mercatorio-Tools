const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UsersDB = require("../models/user");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const { client } = require("../discord/index.js");
const config = require("../discord/config.json");
const utils = require("../discord/utils.js");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const debug = process.argv.includes("--debug");

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

/*
 * ==========================================
 * DISCORD OAUTH CONFIG
 * ==========================================
 */

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const DISCORD_REDIRECT_URI_DEBUG = process.env.DISCORD_REDIRECT_URI_DEBUG;

const MERCTOOLS_URL = process.env.MERCTOOLS_URL;
const MERCTOOLS_URL_DEBUG = process.env.MERCTOOLS_URL_DEBUG;

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI) {
  console.warn(
    "Discord OAuth is not fully configured. " +
      "Set DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET and " +
      "DISCORD_REDIRECT_URI.",
  );
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
 */

function userResponse(user) {
  return user.toJSON();
}

/*
 * ==========================================
 * DISCORD OAUTH STATE
 * ==========================================
 *
 * The state is stored in a temporary HTTP-only
 * cookie and checked again by the callback.
 */

function setDiscordOAuthStateCookie(res, state) {
  res.cookie("discord_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
  });
}

function clearDiscordOAuthStateCookie(res) {
  res.clearCookie("discord_oauth_state", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
}

/*
 * ==========================================
 * DISCORD LOGIN
 * ==========================================
 *
 * GET /api/auth/discord
 *
 * Starts the Discord OAuth2 flow.
 */

router.get("/discord", (req, res) => {
  try {
    if (
      !DISCORD_CLIENT_ID ||
      !DISCORD_CLIENT_SECRET ||
      !DISCORD_REDIRECT_URI ||
      !DISCORD_REDIRECT_URI_DEBUG
    ) {
      return res.status(500).json({
        message: "Discord OAuth is not configured.",
      });
    }

    const state = crypto.randomBytes(32).toString("hex");

    setDiscordOAuthStateCookie(res, state);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: DISCORD_CLIENT_ID,
      scope: "identify",
      state,
      redirect_uri: debug ? DISCORD_REDIRECT_URI_DEBUG : DISCORD_REDIRECT_URI,
    });

    const discordAuthorizationUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;

    return res.redirect(discordAuthorizationUrl);
  } catch (error) {
    console.error("Discord login error:", error);

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error during discord login: ${error.message}`,
    );

    res.status(500).json({ message: "Server error", error });
  }
});

/*
 * ==========================================
 * DISCORD CALLBACK
 * ==========================================
 *
 * GET /api/auth/discord/callback
 *
 * Discord redirects the user here after
 * authorization.
 */

router.get("/discord/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    const savedState = req.cookies?.discord_oauth_state;

    /*
     * Validate OAuth state.
     */
    if (!state || !savedState || state !== savedState) {
      clearDiscordOAuthStateCookie(res);

      return res.status(400).send("Invalid OAuth state.");
    }

    /*
     * State is single-use.
     */
    clearDiscordOAuthStateCookie(res);

    if (!code) {
      return res.status(400).send("Discord authorization code is missing.");
    }

    if (
      !DISCORD_CLIENT_ID ||
      !DISCORD_CLIENT_SECRET ||
      !DISCORD_REDIRECT_URI ||
      !DISCORD_REDIRECT_URI_DEBUG
    ) {
      return res.status(500).send("Discord OAuth is not configured.");
    }

    /*
     * ==========================================
     * Exchange authorization code for token
     * ==========================================
     */

    const tokenBody = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: debug ? DISCORD_REDIRECT_URI_DEBUG : DISCORD_REDIRECT_URI,
    });

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",

      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },

      body: tokenBody,
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Discord OAuth token exchange failed:", tokenData);

      return res.status(401).send("Unable to authenticate with Discord.");
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(401).send("Discord did not provide an access token.");
    }

    /*
     * ==========================================
     * Get Discord user
     * ==========================================
     */

    const discordResponse = await fetch(
      "https://discord.com/api/v10/users/@me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const discordUser = await discordResponse.json();

    if (!discordResponse.ok) {
      console.error("Failed to fetch Discord user:", discordUser);

      return res.status(401).send("Unable to retrieve your Discord account.");
    }

    if (!discordUser.id) {
      return res.status(401).send("Discord account information is invalid.");
    }

    /*
     * ==========================================
     * Find or create Mercatorio Tools user
     * ==========================================
     */

    let user = await UsersDB.findOne({
      "discord.id": discordUser.id,
    });

    if (!user) {
      /*
       * First login = account creation.
       */
      user = new UsersDB({
        discord: {
          id: discordUser.id,
          username: discordUser.username ?? null,
          globalName: discordUser.global_name ?? null,
          avatar: discordUser.avatar ?? null,
        },
      });
    } else {
      /*
       * Keep Discord profile information up to date.
       */
      user.discord.id = discordUser.id;
      user.discord.username = discordUser.username ?? null;
      user.discord.globalName = discordUser.global_name ?? null;
      user.discord.avatar = discordUser.avatar ?? null;
    }

    await user.save();

    /*
     * ==========================================
     * Create Mercatorio Tools session
     * ==========================================
     */

    setAuthCookie(res, user);

    /*
     * Redirect back to the frontend.
     */
    return res.redirect(
      debug ? `${MERCTOOLS_URL_DEBUG}/account` : `${MERCTOOLS_URL}/account`,
    );
  } catch (error) {
    console.error("Discord OAuth callback error:", error);

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error during Discord OAuth callback: ${error.message}`,
    );

    return res.status(500).send("Unable to complete Discord login.");
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
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    res.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error logging out user: ${error.message}`,
    );

    res.status(500).json({
      message: "Server error",
      error,
    });
  }
});

/*
 * ==========================================
 * CURRENT USER
 * ==========================================
 *
 * GET /api/auth/me
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
  } catch (error) {
    console.error("Get current user error:", error);

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting user: ${error.message}`,
    );

    res.status(500).json({
      message: "Server error",
      error,
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
 * Allowed:
 *
 * - settings.notifications.discord
 */

router.patch("/me", auth, async (req, res) => {
  try {
    const { settings } = req.body;

    const user = await UsersDB.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    /*
     * Notification settings.
     */

    if (settings?.notifications) {
      if (settings.notifications.discord !== undefined) {
        user.settings.notifications.discord = Boolean(
          settings.notifications.discord,
        );
      }
    }

    await user.save();

    res.json({
      user: userResponse(user),
    });
  } catch (error) {
    console.error("Update account error:", error);

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error updating user: ${error.message}`,
    );

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
 */

router.get("/discord/me", auth, async (req, res) => {
  try {
    if (!req.user.discord?.id) {
      return res.status(404).json({
        message: "Discord account not linked",
      });
    }

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
    console.error("Error getting Discord user:", error);

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `Error getting Discord user: ${error.message}`,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
