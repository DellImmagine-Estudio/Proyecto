import { useEffect, useState } from "react";
import { apiFetch, clearToken, getToken, setToken } from "../api";

export type Me = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

export function useAuth() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    setLoading(true);
    try {
      if (!getToken()) {
        setMe(null);
        return;
      }
      const res = await apiFetch("/auth/me");
      setMe(res.user);
    } catch {
      clearToken();
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    await loadMe();
  }

  function logout() {
    clearToken();
    setMe(null);
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { me, loading, login, logout, reload: loadMe };
}
