import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import TopNavbar from "../../components/TopNavbar/TopNavbar";

import "./Login.css";

export default function Login() {
  const { user, loading, loginWithDiscord } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || "/account";

  /*
   * If the user is already authenticated,
   * there is no reason to show the login page.
   */

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectPath, {
        replace: true,
      });
    }
  }, [loading, user, navigate, redirectPath]);

  if (loading) {
    return (
      <>
        <TopNavbar />

        <main className="auth-page">
          <div className="auth-card">
            <div className="auth-loading">Checking authentication...</div>
          </div>
        </main>
      </>
    );
  }

  if (user) {
    return null;
  }

  return (
    <>
      <TopNavbar />

      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Welcome</h1>

            <p>Sign in to Mercatorio Tools using your Discord account.</p>
          </div>

          <div className="auth-form">
            <button
              type="button"
              className="discord-login-button"
              onClick={loginWithDiscord}
            >
              <span className="discord-login-icon" aria-hidden="true">
                💬
              </span>

              <span>Continue with Discord</span>
            </button>
          </div>

          <div className="auth-footer">
            <span>
              Your Discord account is used as your Mercatorio Tools identity.
            </span>
          </div>
        </div>
      </main>
    </>
  );
}
