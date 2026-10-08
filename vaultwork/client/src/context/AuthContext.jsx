import { createContext, useContext, useEffect, useState } from "react";
import api from "../api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("vw_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("vw_token"))
      .finally(() => setLoading(false));
  }, []);

  const persist = (data) => {
    localStorage.setItem("vw_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) =>
    persist((await api.post("/auth/login", { email, password })).data);

  const register = async (payload) =>
    persist((await api.post("/auth/register", payload)).data);

  const logout = () => {
    localStorage.removeItem("vw_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
