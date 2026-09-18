import { useAuth } from "../context/AuthContext";

import LoginRedirect from "../components/LoginRedirect";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="auth-loading">Loading...</div>;
  }

  if (!user) {
    return <LoginRedirect />;
  }

  return children;
}
