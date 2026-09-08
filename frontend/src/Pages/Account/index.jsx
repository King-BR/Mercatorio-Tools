import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Account.css";

const API_URL = import.meta.env.VITE_API_URL || "";

function Account() {
  const { user, refreshUser } = useAuth();

  const [discordCode, setDiscordCode] = useState(null);
  const [discordCodeExpiresAt, setDiscordCodeExpiresAt] = useState(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const [discordNotifications, setDiscordNotifications] = useState(
    user?.settings?.notifications?.discord ?? false,
  );

  const [emailNotifications, setEmailNotifications] = useState(
    user?.settings?.notifications?.email ?? false,
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * Atualiza os estados quando o usuário recebido pelo AuthContext mudar.
   */
  useEffect(() => {
    setDiscordNotifications(user?.settings?.notifications?.discord ?? false);

    setEmailNotifications(user?.settings?.notifications?.email ?? false);
  }, [user]);

  /*
   * Gera um novo código para vincular o Discord.
   */
  async function generateDiscordCode() {
    setGeneratingCode(true);
    setError("");
    setMessage("");
    setCopied(false);

    try {
      const response = await fetch(`${API_URL}/api/auth/discord/link-code`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Não foi possível gerar o código.");
      }

      setDiscordCode(data.code);
      setDiscordCodeExpiresAt(data.expiresAt ? new Date(data.expiresAt) : null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao gerar código.");
    } finally {
      setGeneratingCode(false);
    }
  }

  /*
   * Copia o código para o clipboard.
   */
  async function copyDiscordCode() {
    if (!discordCode) return;

    try {
      await navigator.clipboard.writeText(discordCode);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  }

  /*
   * Salva as configurações da conta.
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
              email: emailNotifications,
            },
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Não foi possível salvar as alterações.",
        );
      }

      await refreshUser();

      setMessage("Alterações salvas com sucesso.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  /*
   * Formata a data de expiração do código.
   */
  function formatExpiration(date) {
    if (!date) return "";

    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="account-page">
      <div className="account-container">
        <div className="account-header">
          <h1>Minha conta</h1>

          <p>Gerencie suas informações e preferências do Mercatorio Tools.</p>
        </div>

        {/* Informações da conta */}
        <section className="account-section">
          <div className="section-header">
            <h2>Informações da conta</h2>
          </div>

          <div className="form-group">
            <label>Email</label>

            <input type="email" value={user?.email || ""} disabled />

            <small>O email da conta não pode ser alterado.</small>
          </div>
        </section>

        {/* Discord */}
        <section className="account-section">
          <div className="section-header">
            <h2>Discord</h2>

            <p>
              Vincule sua conta do Discord para receber notificações e utilizar
              recursos relacionados ao Discord.
            </p>
          </div>

          {user?.discordID ? (
            <div className="discord-linked">
              <div className="discord-status">
                <span className="status-dot"></span>

                <div>
                  <strong>Conta vinculada</strong>

                  <span>
                    Seu Discord está conectado à sua conta do Mercatorio Tools.
                  </span>
                </div>
              </div>

              <div className="discord-id">Discord ID: {user.discordID}</div>
            </div>
          ) : (
            <div className="discord-unlinked">
              <div className="discord-info">
                <strong>Conta não vinculada</strong>

                <span>
                  Generate a code and send it to the Mercatorio Tools bot on
                  Discord.
                </span>
              </div>

              {!discordCode ? (
                <button
                  className="primary-button"
                  onClick={generateDiscordCode}
                  disabled={generatingCode}
                >
                  {generatingCode ? "Generating..." : "Link Discord"}
                </button>
              ) : (
                <div className="discord-link-code">
                  <div className="code-label">Your link code</div>

                  <div className="code-container">
                    <span className="discord-code">{discordCode}</span>

                    <button className="copy-button" onClick={copyDiscordCode}>
                      {copied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>

                  <div className="discord-instructions">
                    <p>
                      Send the code above to the Mercatorio Tools bot on
                      Discord.
                    </p>

                    <code>/link {discordCode}</code>

                    {discordCodeExpiresAt && (
                      <span className="code-expiration">
                        The code expires at{" "}
                        {formatExpiration(discordCodeExpiresAt)}.
                      </span>
                    )}
                  </div>

                  <button
                    className="secondary-button"
                    onClick={generateDiscordCode}
                    disabled={generatingCode}
                  >
                    {generatingCode ? "Generating..." : "Generate new code"}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Notificações */}
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
                disabled={!user?.discordID}
              />

              <div>
                <strong>Discord</strong>

                <span>
                  Receive notifications via Discord.
                  {!user?.discordID && " Link your Discord account first."}
                </span>
              </div>
            </label>
            {/*
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(event) =>
                  setEmailNotifications(event.target.checked)
                }
                disabled={true}
              />

              <div>
                <strong>Email</strong>

                <span>Receive notifications via email. (Not implemented yet)</span>
              </div>
            </label>
            */}
          </div>
        </section>

        {/* Security */}
        <section className="account-section">
          <div className="section-header">
            <h2>Security</h2>
          </div>

          <div className="security-item">
            <div>
              <strong>Password</strong>

              <span>Change the password used to log into your account.</span>
            </div>

            <button className="secondary-button" disabled>
              Change Password
            </button>
          </div>
        </section>

        {/* Messages */}
        {message && <div className="success-message">{message}</div>}

        {error && <div className="error-message">{error}</div>}

        {/* Save */}
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
  );
}

export default Account;
