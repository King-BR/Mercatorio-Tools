import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasMercatorioApiKey, setHasMercatorioApiKey] = useState(false);
  const [hasMercToolsApiKey, setHasMercToolsApiKey] = useState(false);

  async function refreshUser() {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const data = await response.json();

      setHasMercatorioApiKey(
        data.user.apiKeys.find((keyData) => keyData.keyType === "GAME") !==
          undefined,
      );

      setHasMercToolsApiKey(
        data.user.apiKeys.find((keyData) => keyData.keyType === "MERCTOOLS") !==
          undefined,
      );

      setUser(data.user ?? data);

      return data.user ?? data;
    } catch (error) {
      console.error("Failed to fetch current user:", error);

      setUser(null);

      return null;
    }
  }

  /*
   * ==========================================
   * DISCORD LOGIN
   * ==========================================
   *
   * The backend handles the entire OAuth2 flow.
   */

  function loginWithDiscord() {
    window.location.href = "/api/auth/discord";
  }

  /*
   * ==========================================
   * LOGOUT
   * ==========================================
   */

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  }

  /*
   * ==========================================
   * INITIAL AUTH CHECK
   * ==========================================
   */

  useEffect(() => {
    async function initializeAuth() {
      await refreshUser();
      setLoading(false);
    }

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        hasMercatorioApiKey,
        hasMercToolsApiKey,
        loading,
        loginWithDiscord,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
