import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  login as loginAPI,
  getMyProfile,
} from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------
  // Load existing session
  // -------------------------------------------------------

  useEffect(() => {
    async function loadUser() {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getMyProfile();

        setUser(profile);

        localStorage.setItem(
          "user",
          JSON.stringify(profile)
        );
      } catch (error) {
        console.error(
          "Session restoration failed:",
          error
        );

        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem("user");

        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // -------------------------------------------------------
  // Login
  // -------------------------------------------------------

  async function login(email, password) {
    const tokenResponse = await loginAPI({
      email,
      password,
    });

    const token =
      tokenResponse.access_token;

    if (!token) {
      throw new Error(
        "No access token received from server."
      );
    }

    localStorage.setItem(
      "access_token",
      token
    );

    // IMPORTANT:
    // Login API gives token only.
    // Get the actual user and role separately.

    const profile = await getMyProfile();

    setUser(profile);

    localStorage.setItem(
      "user",
      JSON.stringify(profile)
    );

    return profile;
  }

  // -------------------------------------------------------
  // Logout
  // -------------------------------------------------------

  function logout() {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem("user");

    setUser(null);
  }

  // -------------------------------------------------------
  // Context
  // -------------------------------------------------------

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}