const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);

  // Setear Content-Type solo si hay body y NO es FormData
  const hasBody = typeof options.body !== "undefined" && options.body !== null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.error ?? `HTTP ${res.status}`);
  }

  return data;
}
