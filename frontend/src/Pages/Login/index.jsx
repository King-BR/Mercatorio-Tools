import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import TopNavbar from "../../components/TopNavbar/TopNavbar";

import "./Login.css";

export default function Login() {
  const { login } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [loginType, setLoginType] = useState("username");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectPath = location.state?.from?.pathname || "/account";

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if ((!email && !username) || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      await login(email, username, password);

      navigate(redirectPath, { replace: true });
    } catch (error) {
      setError(error.message || "Unable to log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopNavbar />
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Welcome back</h1>
            <p>Sign in to your Mercatorio Tools account.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <button
                type="button"
                className="auth-button"
                onClick={() =>
                  setLoginType(loginType === "username" ? "email" : "username")
                }
                disabled={loading}
              >
                Sign in with {loginType === "username" ? "email" : "username"}
              </button>
            </div>

            {loginType === "email" && (
              <div className="form-group">
                <label htmlFor="email">Email</label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            )}

            {loginType === "username" && (
              <div className="form-group">
                <label htmlFor="username">Username</label>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="very_cool_username123"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="auth-footer">
            <span>Don't have an account?</span>

            <Link to="/register">Create an account</Link>
          </div>
        </div>
      </main>
    </>
  );
}
