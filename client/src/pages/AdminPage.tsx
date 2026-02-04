import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../auth/useAuth";

type AdminUser = {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
};

export default function AdminPage({ me }: { me: { role: "ADMIN" | "USER" } }) {
  const nav = useNavigate();
  const { logout } = useAuth();

  // 🔒 Protección en la misma página
  useEffect(() => {
    if (me.role !== "ADMIN") nav("/", { replace: true });
  }, [me.role, nav]);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadUsers() {
    setLoadingUsers(true);
    setError(null);
    try {
      const r = await apiFetch("/admin/users");
      setUsers(r.users as AdminUser[]);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando usuarios");
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMsg(null);
    setError(null);

    try {
      const r = await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
      });

      setMsg(`✅ Usuario creado: ${r.user.email} (${r.user.role})`);
      setEmail("");
      setPassword("");
      setRole("USER");
      await loadUsers();
    } catch (e: any) {
      setError(e?.message ?? "Error creando usuario");
    } finally {
      setCreating(false);
    }
  }

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.email.localeCompare(b.email));
  }, [users]);

  async function handleLogout() {
    await logout();
    nav("/login", { replace: true });
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Admin Panel</h2>
          <p style={{ margin: "6px 0 0", opacity: 0.8 }}>
            Gestión de usuarios (solo ADMIN)
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Mensajes */}
      {msg && (
        <div
          style={{ padding: 10, marginBottom: 12, border: "1px solid #ccc" }}
        >
          {msg}
        </div>
      )}
      {error && (
        <div
          style={{ padding: 10, marginBottom: 12, border: "1px solid #f99" }}
        >
          ❌ {error}
        </div>
      )}

      {/* Form crear usuario */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: 16,
          borderRadius: 8,
          marginBottom: 18,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Crear usuario</h3>

        <form
          onSubmit={createUser}
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "1fr 1fr 160px 140px",
            alignItems: "end",
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="user@dominio.com"
              style={{ padding: 8 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={6}
              placeholder="mínimo 6"
              style={{ padding: 8 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Rol
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              style={{ padding: 8 }}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>

          <button type="submit" disabled={creating} style={{ padding: 10 }}>
            {creating ? "Creando..." : "Crear"}
          </button>
        </form>
      </div>

      {/* Lista de usuarios */}
      <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Usuarios</h3>
          <button
            onClick={loadUsers}
            disabled={loadingUsers}
            style={{ padding: "8px 10px" }}
          >
            {loadingUsers ? "Actualizando..." : "Refrescar"}
          </button>
        </div>

        {loadingUsers ? (
          <p>Cargando...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #eee",
                    padding: 8,
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #eee",
                    padding: 8,
                  }}
                >
                  Rol
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #eee",
                    padding: 8,
                  }}
                >
                  Creado
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>
                    {u.email}
                  </td>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>
                    {u.role}
                  </td>
                  <td style={{ borderBottom: "1px solid #f3f3f3", padding: 8 }}>
                    {new Date(u.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
