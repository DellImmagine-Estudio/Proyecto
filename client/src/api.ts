const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const hasBody = init.body !== undefined && init.body !== null;

  const headers = new Headers(init.headers ?? {});
  // ✅ Solo seteamos JSON si realmente hay body
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error ?? data?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }

  // ✅ Por si algún endpoint devuelve 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// opcional: compat
export const api = apiFetch;
