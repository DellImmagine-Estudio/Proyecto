import { useEffect, useState } from "react";
import { apiFetch } from "../api";

export type MeUser = {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
};

export function useAuth() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    try {
      const r = await apiFetch("/auth/me");
      setMe(r.user as MeUser);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const r = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // backend devuelve { ok, user } y setea cookie httpOnly
    setMe(r.user as MeUser);
  }

  async function logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      setMe(null);
    }
  }

  return { me, loading, login, logout, refreshMe };
}
