import { useAuth } from "../context/AuthContext";

import LoginRedirect from "./LoginRedirect";
import NotFoundRedirect from "./NotFoundRedirect";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <LoginRedirect />;
  }

  if (!user.isAdmin) {
    return <NotFoundRedirect />;
  }

  return children;
}
