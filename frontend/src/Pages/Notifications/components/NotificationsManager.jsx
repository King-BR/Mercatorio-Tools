import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "";

function formatDate(value) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

export default function NotificationsManager({ onCreate, onEdit }) {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/notifications`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load notifications.");
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);

      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function toggle(notification) {
    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${notification._id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enabled: !notification.enabled,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update notification.");
      }

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? data.notification : item,
        ),
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function duplicate(notification) {
    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${notification._id}/duplicate`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to duplicate notification.");
      }

      setNotifications((current) => [data.notification, ...current]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(notification) {
    if (!window.confirm(`Delete "${notification.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${notification._id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete notification.");
      }

      setNotifications((current) =>
        current.filter((item) => item._id !== notification._id),
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="notifications-page">
      <div className="notifications-container">
        <header className="notifications-header">
          <div>
            <h1>Notifications</h1>

            <p>Create custom alerts based on Mercatorio data.</p>
          </div>

          <button
            type="button"
            className="notifications-create-button"
            onClick={onCreate}
          >
            + Create Notification
          </button>
        </header>

        {error && <div className="notifications-error">{error}</div>}

        {loading ? (
          <div className="notifications-empty">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <h2>No notifications</h2>

            <p>Create your first custom notification.</p>

            <button
              type="button"
              className="notifications-create-button"
              onClick={onCreate}
            >
              Create Notification
            </button>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <article key={notification._id} className="notification-card">
                <div className="notification-card-main">
                  <div className="notification-card-title">
                    <span
                      className={`notification-status ${
                        notification.enabled ? "enabled" : "disabled"
                      }`}
                    >
                      {notification.enabled ? "Enabled" : "Disabled"}
                    </span>

                    <h2>{notification.name}</h2>
                  </div>

                  {notification.description && (
                    <p className="notification-description">
                      {notification.description}
                    </p>
                  )}

                  <div className="notification-meta">
                    <span>{notification.nodes?.length ?? 0} nodes</span>

                    <span>{notification.edges?.length ?? 0} connections</span>

                    <span>Updated {formatDate(notification.updatedAt)}</span>
                  </div>
                </div>

                <div className="notification-card-actions">
                  <button
                    type="button"
                    className="notification-toggle"
                    onClick={() => toggle(notification)}
                  >
                    {notification.enabled ? "Disable" : "Enable"}
                  </button>

                  <button
                    type="button"
                    className="notification-edit"
                    onClick={() => onEdit(notification._id)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="notification-secondary"
                    onClick={() => duplicate(notification)}
                  >
                    Duplicate
                  </button>

                  <button
                    type="button"
                    className="notification-delete"
                    onClick={() => remove(notification)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
