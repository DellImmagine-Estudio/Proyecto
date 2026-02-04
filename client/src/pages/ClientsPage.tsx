import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { useNavigate } from "react-router-dom";

type Client = {
  id: string;
  userId: string;
  razonSocial: string;
  cuit: string | null;
  tipoPersona: string | null;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  razonSocial: string;
  cuit: string;
  tipoPersona: "JURIDICA" | "FISICA" | "";
};

export default function ClientsPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const query = useMemo(() => q.trim(), [q]);

  const [form, setForm] = useState<FormState>({
    razonSocial: "",
    cuit: "",
    tipoPersona: "",
  });

  // edición inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>({
    razonSocial: "",
    cuit: "",
    tipoPersona: "",
  });

  // Escape => volver al menú
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") navigate("/");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(query ? `/clients?q=${encodeURIComponent(query)}` : "/clients");
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message ?? "Error cargando clientes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        razonSocial: form.razonSocial.trim(),
      };
      if (form.cuit.trim()) payload.cuit = form.cuit.trim();
      if (form.tipoPersona) payload.tipoPersona = form.tipoPersona;

      await apiFetch("/clients", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setForm({ razonSocial: "", cuit: "", tipoPersona: "" });
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Error creando cliente");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c: Client) {
    setEditingId(c.id);
    setEditForm({
      razonSocial: c.razonSocial ?? "",
      cuit: c.cuit ?? "",
      tipoPersona: (c.tipoPersona as any) ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ razonSocial: "", cuit: "", tipoPersona: "" });
  }

  async function saveEdit(id: string) {
    setSaving(true);
    setError(null);

    try {
      const payload: any = {};
      if (editForm.razonSocial.trim()) payload.razonSocial = editForm.razonSocial.trim();

      // si lo dejás vacío, mandamos null para limpiar
      payload.cuit = editForm.cuit.trim() ? editForm.cuit.trim() : null;

      // si lo dejás vacío, mandamos null para limpiar
      payload.tipoPersona = editForm.tipoPersona ? editForm.tipoPersona : null;

      await apiFetch(`/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      cancelEdit();
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Error guardando cambios");
    } finally {
      setSaving(false);
    }
  }

  async function removeClient(id: string) {
    const ok = confirm("¿Seguro que querés borrar este cliente?");
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      await apiFetch(`/clients/${id}`, { method: "DELETE" });
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Error borrando cliente");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>ABM Clientes</h2>
        <button onClick={() => navigate("/")} title="Escape también vuelve">
          Volver al menú (Esc)
        </button>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <input
          placeholder="Buscar por razón social o CUIT…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={() => load()} disabled={loading}>
          Buscar
        </button>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <form onSubmit={handleCreate} style={{ display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>Nuevo cliente</h3>

        <input
          placeholder="Razón social (obligatorio)"
          value={form.razonSocial}
          onChange={(e) => setForm((s) => ({ ...s, razonSocial: e.target.value }))}
          style={{ padding: 8 }}
        />

        <input
          placeholder="CUIT (opcional)"
          value={form.cuit}
          onChange={(e) => setForm((s) => ({ ...s, cuit: e.target.value }))}
          style={{ padding: 8 }}
        />

        <select
          value={form.tipoPersona}
          onChange={(e) => setForm((s) => ({ ...s, tipoPersona: e.target.value as any }))}
          style={{ padding: 8 }}
        >
          <option value="">Tipo persona (opcional)</option>
          <option value="JURIDICA">Jurídica</option>
          <option value="FISICA">Física</option>
        </select>

        <button type="submit" disabled={saving || !form.razonSocial.trim()}>
          {saving ? "Guardando..." : "Crear cliente"}
        </button>

        {error && <div style={{ color: "crimson" }}>{error}</div>}
      </form>

      <hr style={{ margin: "16px 0" }} />

      <h3 style={{ marginTop: 0 }}>Listado</h3>

      {loading ? (
        <p>Cargando…</p>
      ) : items.length === 0 ? (
        <p>No hay clientes.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((c) => {
            const isEditing = editingId === c.id;

            return (
              <div
                key={c.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 12,
                  display: "grid",
                  gap: 8,
                }}
              >
                {!isEditing ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <strong>{c.razonSocial}</strong>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => startEdit(c)} disabled={saving}>
                          Editar
                        </button>
                        <button onClick={() => removeClient(c.id)} disabled={saving}>
                          Borrar
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span>CUIT: {c.cuit ?? "-"}</span>
                      <span>Tipo: {c.tipoPersona ?? "-"}</span>
                    </div>

                    <small style={{ opacity: 0.7 }}>
                      ID: {c.id} · Actualizado: {new Date(c.updatedAt).toLocaleString()}
                    </small>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <strong>Editando</strong>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => saveEdit(c.id)} disabled={saving || !editForm.razonSocial.trim()}>
                          Guardar
                        </button>
                        <button onClick={cancelEdit} disabled={saving}>
                          Cancelar
                        </button>
                      </div>
                    </div>

                    <input
                      value={editForm.razonSocial}
                      onChange={(e) => setEditForm((s) => ({ ...s, razonSocial: e.target.value }))}
                      style={{ padding: 8 }}
                    />
                    <input
                      value={editForm.cuit}
                      onChange={(e) => setEditForm((s) => ({ ...s, cuit: e.target.value }))}
                      style={{ padding: 8 }}
                      placeholder="CUIT (vacío = limpiar)"
                    />
                    <select
                      value={editForm.tipoPersona}
                      onChange={(e) => setEditForm((s) => ({ ...s, tipoPersona: e.target.value as any }))}
                      style={{ padding: 8 }}
                    >
                      <option value="">(vacío = limpiar)</option>
                      <option value="JURIDICA">Jurídica</option>
                      <option value="FISICA">Física</option>
                    </select>

                    {error && <div style={{ color: "crimson" }}>{error}</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
