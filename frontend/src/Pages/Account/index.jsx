import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import TopNavbar from "../../components/TopNavbar/TopNavbar";

import "./Account.css";

const API_URL = import.meta.env.VITE_API_URL || "";

function Account() {
  const { user, refreshUser, logout } = useAuth();

  const navigate = useNavigate();

  const [discordNotifications, setDiscordNotifications] = useState(
    user?.settings?.notifications?.discord ?? false,
  );

  const [publicStats, setPublicStats] = useState(
    user?.settings?.info?.publicStats ?? false,
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * Update local state when the authenticated
   * user changes.
   */

  useEffect(() => {
    setDiscordNotifications(user?.settings?.notifications?.discord ?? false);

    setPublicStats(user?.settings?.info?.publicStats ?? false);
  }, [user]);

  /*
   * Save account settings.
   */

  async function saveChanges() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "PATCH",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          settings: {
            notifications: {
              discord: discordNotifications,
            },
            info: {
              publicStats: publicStats,
            },
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save changes.");
      }

      await refreshUser();

      setMessage("Changes saved successfully.");
    } catch (err) {
      console.error(err);

      setError(err.message || "Error saving changes.");
    } finally {
      setSaving(false);
    }
  }

  /*
   * Logout.
   */

  async function handleLogout() {
    await logout();

    navigate("/", {
      replace: true,
    });
  }

  /*
   * Discord avatar URL.
   */

  function getDiscordAvatarUrl() {
    if (!user?.discord?.id || !user?.discord?.avatar) {
      return null;
    }

    return `https://cdn.discordapp.com/avatars/${user.discord.id}/${user.discord.avatar}.png?size=128`;
  }

  const discordAvatar = getDiscordAvatarUrl();

  return (
    <>
      <TopNavbar />

      <div className="account-page">
        <div className="account-container">
          <div className="account-header">
            <div>
              <h1>My Account</h1>

              <p>
                Manage your information and preferences for Mercatorio Tools.
              </p>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>

          {/* ================================== */}
          {/* DISCORD ACCOUNT */}
          {/* ================================== */}

          <section className="account-section">
            <div className="section-header">
              <h2>Discord Account</h2>
            </div>

            <div
              className="discord-account"
              style={{ display: "flex", gap: "1rem" }}
            >
              {discordAvatar ? (
                <img
                  className="discord-avatar"
                  src={discordAvatar}
                  alt="Discord avatar"
                />
              ) : (
                <div className="discord-avatar discord-avatar-placeholder">
                  {(user?.discord?.globalName || user?.discord?.username || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <div className="discord-account-info">
                <div>
                  Username:{" "}
                  <span>
                    {user?.discord?.globalName ||
                      user?.discord?.username ||
                      "Discord User"}
                  </span>
                </div>

                <div>
                  Tag: <span>@{user?.discord?.username || "unknown"}</span>
                </div>

                <div>
                  Discord ID: <span>{user?.discord?.id || "Unknown"}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ================================== */}
          {/* NOTIFICATIONS */}
          {/* ================================== */}

          <section className="account-section">
            <div className="section-header">
              <h2>Notifications</h2>

              <p>
                Choose where you want to receive notifications from Mercatorio
                Tools.
              </p>
            </div>

            <div className="notification-options">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={discordNotifications}
                  onChange={(event) =>
                    setDiscordNotifications(event.target.checked)
                  }
                  disabled={!user?.discord?.id || saving}
                />

                <div>
                  <strong>Discord</strong>

                  <span>Receive notifications via Discord.</span>
                </div>
              </label>
            </div>
          </section>

          {/* ================================== */}
          {/* MESSAGES */}
          {/* ================================== */}

          {message && <div className="success-message">{message}</div>}

          {error && <div className="error-message">{error}</div>}

          {/* ================================== */}
          {/* ACTIONS */}
          {/* ================================== */}

          <div className="account-actions">
            <button
              className="primary-button save-button"
              onClick={saveChanges}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Account;
