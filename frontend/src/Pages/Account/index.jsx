import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import TopNavbar from "../../components/TopNavbar/TopNavbar";

import "./Account.css";

const API_URL = import.meta.env.VITE_API_URL || "";

const PERMISSIONS = ["READ", "WRITE", "ADMIN"];
const GAME_PERMISSIONS = ["READ", "WRITE"];

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

  const [gameKey, setGameKey] = useState("");
  const [gameMercUser, setGameMercUser] = useState("");

  const [editingGameKey, setEditingGameKey] = useState(null);
  const [editingGameSecret, setEditingGameSecret] = useState("");
  const [editingGameMercUser, setEditingGameMercUser] = useState("");

  const [merctoolsPermissions, setMerctoolsPermissions] = useState(["READ"]);
  const [gamePermissions, setGamePermissions] = useState(["READ"]);

  const [editingMerctoolsKey, setEditingMerctoolsKey] = useState(null);
  const [editingMerctoolsPermissions, setEditingMerctoolsPermissions] =
    useState(["READ"]);

  const [newSecret, setNewSecret] = useState("");

  const [apiKeyLoading, setApiKeyLoading] = useState(false);

  useEffect(() => {
    setDiscordNotifications(user?.settings?.notifications?.discord ?? false);

    setPublicStats(user?.settings?.info?.publicStats ?? false);
  }, [user]);

  const apiKeys = useMemo(() => user?.apiKeys ?? [], [user]);

  const gameKeys = useMemo(
    () => apiKeys.filter((apiKey) => apiKey.keyType === "GAME"),
    [apiKeys],
  );

  const merctoolsKeys = useMemo(
    () => apiKeys.filter((apiKey) => apiKey.keyType === "MERCTOOLS"),
    [apiKeys],
  );

  async function parseResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

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
              publicStats,
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

  async function addGameKey(event) {
    event.preventDefault();

    if (!gameKey.trim()) {
      setError("Enter your Mercatorio API key.");
      return;
    }

    if (!gameMercUser.trim()) {
      setError("Enter your Mercatorio user.");
      return;
    }

    setApiKeyLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/apiKeys/game`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          key: gameKey.trim(),
          mercUser: gameMercUser.trim(),
          permissions: gamePermissions,
        }),
      });

      await parseResponse(response);

      setGameKey("");
      setGameMercUser("");

      await refreshUser();

      setMessage("Mercatorio API key added successfully.");
    } catch (err) {
      console.error(err);

      setError(err.message || "Failed to add Mercatorio API key.");
    } finally {
      setApiKeyLoading(false);
    }
  }

  function startEditingGameKey(apiKey) {
    setEditingGameKey(apiKey);
    setEditingGameSecret("");
    setEditingGameMercUser(apiKey.mercUser || "");
    setMessage("");
    setError("");
  }

  function cancelEditingGameKey() {
    setEditingGameKey(null);
    setEditingGameSecret("");
    setEditingGameMercUser("");
  }

  async function updateGameKey(event) {
    event.preventDefault();

    if (!editingGameMercUser.trim()) {
      setError("Mercatorio user is required.");
      return;
    }

    setApiKeyLoading(true);
    setMessage("");
    setError("");

    try {
      const body = {
        mercUser: editingGameMercUser.trim(),
      };

      if (editingGameSecret.trim()) {
        body.key = editingGameSecret.trim();
      }

      const response = await fetch(
        `${API_URL}/api/apiKeys/${editingGameKey._id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(body),
        },
      );

      await parseResponse(response);

      cancelEditingGameKey();

      await refreshUser();

      setMessage("Mercatorio API key updated successfully.");
    } catch (err) {
      console.error(err);

      setError(err.message || "Failed to update Mercatorio API key.");
    } finally {
      setApiKeyLoading(false);
    }
  }

  async function removeApiKey(apiKey) {
    const confirmed = window.confirm(
      `Are you sure you want to revoke this ${
        apiKey.keyType === "GAME" ? "Mercatorio" : "Mercatorio Tools"
      } API key?`,
    );

    if (!confirmed) {
      return;
    }

    setApiKeyLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/apiKeys/${apiKey._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      await parseResponse(response);

      if (editingGameKey?._id === apiKey._id) {
        cancelEditingGameKey();
      }

      if (editingMerctoolsKey?._id === apiKey._id) {
        cancelEditingMerctoolsKey();
      }

      await refreshUser();

      setMessage("API key revoked successfully.");
      setTimeout(() => setMessage(""), 10000);
    } catch (err) {
      console.error(err);

      setError(err.message || "Failed to revoke API key.");
    } finally {
      setApiKeyLoading(false);
    }
  }

  function togglePermission(currentPermissions, setPermissions, permission) {
    setPermissions((current) => {
      if (current.includes(permission)) {
        if (current.length === 1) {
          return current;
        }

        return current.filter((item) => item !== permission);
      }

      return [...current, permission];
    });
  }

  async function generateMercToolsKey() {
    setApiKeyLoading(true);
    setMessage("");
    setError("");
    setNewSecret("");

    try {
      const response = await fetch(`${API_URL}/api/apiKeys/merctools`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          permissions: merctoolsPermissions,
        }),
      });

      const data = await parseResponse(response);

      setNewSecret(data.secret || "");

      await refreshUser();

      setMessage("Mercatorio Tools API key generated successfully.");
      setTimeout(() => setMessage(""), 10000);
    } catch (err) {
      console.error(err);

      setError(err.message || "Failed to generate Mercatorio Tools API key.");
    } finally {
      setApiKeyLoading(false);
    }
  }

  function startEditingMerctoolsKey(apiKey) {
    setEditingMerctoolsKey(apiKey);

    setEditingMerctoolsPermissions(
      apiKey.permissions?.length ? [...apiKey.permissions] : ["READ"],
    );

    setMessage("");
    setError("");
  }

  function cancelEditingMerctoolsKey() {
    setEditingMerctoolsKey(null);
    setEditingMerctoolsPermissions(["READ"]);
  }

  async function updateMerctoolsKey() {
    if (editingMerctoolsPermissions.length === 0) {
      setError("At least one permission is required.");
      return;
    }

    setApiKeyLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/apiKeys/${editingMerctoolsKey._id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            permissions: editingMerctoolsPermissions,
          }),
        },
      );

      await parseResponse(response);

      cancelEditingMerctoolsKey();

      await refreshUser();

      setMessage("Mercatorio Tools API key updated successfully.");
      setTimeout(() => setMessage(""), 10000);
    } catch (err) {
      console.error(err);

      setError(err.message || "Failed to update Mercatorio Tools API key.");
    } finally {
      setApiKeyLoading(false);
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);

      setMessage("Copied to clipboard.");
      setTimeout(() => setMessage(""), 10000);
      setError("");
    } catch (err) {
      console.error(err);

      setError("Failed to copy to clipboard.");
    }
  }

  async function handleLogout() {
    await logout();

    navigate("/", {
      replace: true,
    });
  }

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
          {/* MESSAGES */}
          {/* ================================== */}

          {message && <div className="success-message">{message}</div>}

          {error && <div className="error-message">{error}</div>}

          {/* ================================== */}
          {/* DISCORD ACCOUNT */}
          {/* ================================== */}

          <section className="account-section">
            <div className="section-header">
              <h2>Discord Account</h2>
            </div>

            <div className="discord-account">
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
          {/* GAME API KEYS */}
          {/* ================================== */}

          <section className="account-section">
            <div className="section-header">
              <h2>Mercatorio API Keys</h2>

              <p>Manage API keys belonging to your Mercatorio game account.</p>
            </div>

            <div className="api-key-list">
              {gameKeys.length === 0 ? (
                <div className="api-key-empty">
                  No Mercatorio API keys registered.
                </div>
              ) : (
                gameKeys.map((apiKey) => (
                  <div className="api-key-card" key={apiKey._id}>
                    {editingGameKey?._id === apiKey._id ? (
                      <form
                        className="api-key-edit-form"
                        onSubmit={updateGameKey}
                      >
                        <div className="api-key-title">
                          Edit Mercatorio API Key
                        </div>

                        <div className="form-group">
                          <label htmlFor="edit-game-merc-user">
                            Mercatorio User
                          </label>

                          <input
                            id="edit-game-merc-user"
                            type="text"
                            value={editingGameMercUser}
                            onChange={(event) =>
                              setEditingGameMercUser(event.target.value)
                            }
                            disabled={apiKeyLoading}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="edit-game-key">Replace API Key</label>

                          <input
                            id="edit-game-key"
                            type="password"
                            value={editingGameSecret}
                            onChange={(event) =>
                              setEditingGameSecret(event.target.value)
                            }
                            placeholder="Leave empty to keep the current key"
                            disabled={apiKeyLoading}
                          />
                        </div>

                        <div className="api-key-actions">
                          <button
                            type="submit"
                            className="primary-button"
                            disabled={apiKeyLoading}
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={cancelEditingGameKey}
                            disabled={apiKeyLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="api-key-main">
                          <div className="api-key-title">
                            Mercatorio Game Key
                          </div>

                          <div className="api-key-value">{apiKey.key}</div>

                          <div className="api-key-meta">
                            <span>
                              Merc User:{" "}
                              <strong>{apiKey.mercUser || "Unknown"}</strong>
                            </span>
                          </div>

                          <div className="api-key-meta">
                            <span>Permissions:</span>

                            <div className="permission-badges">
                              {(apiKey.permissions || ["READ"]).map(
                                (permission) => (
                                  <span
                                    className="permission-badge"
                                    key={permission}
                                  >
                                    {permission}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="api-key-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => startEditingGameKey(apiKey)}
                            disabled={apiKeyLoading}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => removeApiKey(apiKey)}
                            disabled={apiKeyLoading}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <form className="api-key-add-form" onSubmit={addGameKey}>
              <h3>Add Mercatorio API Key</h3>

              <div className="form-row marginTop">
                <div className="form-group">
                  <label htmlFor="game-key">API Key</label>

                  <input
                    id="game-key"
                    type="password"
                    value={gameKey}
                    onChange={(event) => setGameKey(event.target.value)}
                    placeholder="Enter your Mercatorio API key"
                    disabled={apiKeyLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="game-merc-user">Mercatorio User</label>

                  <input
                    id="game-merc-user"
                    type="text"
                    value={gameMercUser}
                    onChange={(event) => setGameMercUser(event.target.value)}
                    placeholder="Your Mercatorio username"
                    disabled={apiKeyLoading}
                  />
                </div>

                <div className="permission-options marginBottom">
                  {GAME_PERMISSIONS.map((permission) => (
                    <label className="permission-option" key={permission}>
                      <input
                        type="checkbox"
                        checked={gamePermissions.includes(permission)}
                        onChange={() =>
                          togglePermission(
                            gamePermissions,
                            setGamePermissions,
                            permission,
                          )
                        }
                        disabled={apiKeyLoading || permission === "READ"}
                      />

                      <span>{permission}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={apiKeyLoading}
              >
                Add Game Key
              </button>
            </form>
          </section>

          {/* ================================== */}
          {/* MERC TOOLS API KEYS */}
          {/* ================================== */}

          <section className="account-section">
            <div className="section-header">
              <h2>Mercatorio Tools API Keys</h2>

              <p>Manage API keys used to access Mercatorio Tools APIs.</p>
            </div>

            <div className="api-key-list">
              {merctoolsKeys.length === 0 ? (
                <div className="api-key-empty">
                  No Mercatorio Tools API keys.
                </div>
              ) : (
                merctoolsKeys.map((apiKey) => (
                  <div className="api-key-card" key={apiKey._id}>
                    {editingMerctoolsKey?._id === apiKey._id ? (
                      <div className="api-key-edit-form">
                        <div className="api-key-title">
                          Edit Mercatorio Tools API Key
                        </div>

                        <div className="permission-options marginTop">
                          {PERMISSIONS.map((permission) => (
                            <label
                              className="permission-option"
                              key={permission}
                            >
                              <input
                                type="checkbox"
                                checked={editingMerctoolsPermissions.includes(
                                  permission,
                                )}
                                onChange={() =>
                                  togglePermission(
                                    editingMerctoolsPermissions,
                                    setEditingMerctoolsPermissions,
                                    permission,
                                  )
                                }
                                disabled={apiKeyLoading}
                              />

                              <span>{permission}</span>
                            </label>
                          ))}
                        </div>

                        <div className="api-key-actions">
                          <button
                            type="button"
                            className="primary-button"
                            onClick={updateMerctoolsKey}
                            disabled={apiKeyLoading}
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            className="secondary-button"
                            onClick={cancelEditingMerctoolsKey}
                            disabled={apiKeyLoading}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="api-key-main">
                          <div className="api-key-title">
                            Mercatorio Tools Key
                          </div>

                          <div className="api-key-value">{apiKey.key}</div>

                          <div className="api-key-meta">
                            <span>Permissions:</span>

                            <div className="permission-badges">
                              {(apiKey.permissions || ["READ"]).map(
                                (permission) => (
                                  <span
                                    className="permission-badge"
                                    key={permission}
                                  >
                                    {permission}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="api-key-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => startEditingMerctoolsKey(apiKey)}
                            disabled={apiKeyLoading}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => removeApiKey(apiKey)}
                            disabled={apiKeyLoading}
                          >
                            Revoke
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="api-key-generator">
              <h3>Generate Mercatorio Tools Key</h3>

              <p>
                Select the permissions for the new API key. The complete key
                will only be shown once.
              </p>

              <div className="permission-options marginBottom">
                {PERMISSIONS.map((permission) =>
                  permission === "ADMIN" && !user?.isAdmin ? null : (
                    <label className="permission-option" key={permission}>
                      <input
                        type="checkbox"
                        checked={merctoolsPermissions.includes(permission)}
                        onChange={() =>
                          togglePermission(
                            merctoolsPermissions,
                            setMerctoolsPermissions,
                            permission,
                          )
                        }
                        disabled={apiKeyLoading || permission === "READ"}
                      />

                      <span>{permission}</span>
                    </label>
                  ),
                )}
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={generateMercToolsKey}
                disabled={apiKeyLoading}
              >
                Generate API Key
              </button>

              {newSecret && (
                <div className="new-api-key">
                  <div className="new-api-key-warning">
                    Copy this key now. You will not be able to view the complete
                    key again.
                  </div>

                  <div className="new-api-key-value">
                    <code>{newSecret}</code>

                    <button
                      type="button"
                      className="copy-button"
                      onClick={() => copyText(newSecret)}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

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
