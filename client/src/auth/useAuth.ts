import { useEffect, useState } from "react";
import { apiFetch } from "../api";

type MeUser = {
  id: string;
  email: string;
  createdAt: string;
};

export function useAuth() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await apiFetch("/auth/me");
        setMe(r.user as MeUser);
      } catch {
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const r = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // backend ahora NO devuelve token, devuelve { ok, user }
    setMe(r.user as MeUser);
  }

  async function logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      setMe(null);
    }
  }

  return { me, loading, login, logout };
}
