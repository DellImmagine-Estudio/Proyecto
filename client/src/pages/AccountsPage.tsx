import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api"; // <-- ajustá si tu api.ts exporta otro nombre

type AccountType = "CLIENT" | "CASH" | "BANK" | "INCOME";

type Account = {
  id: string;
  name: string;
  type: AccountType;
  isActive: boolean;
  clientId: string | null;
};

const TYPE_LABEL: Record<AccountType, string> = {
  CASH: "Caja",
  BANK: "Banco",
  INCOME: "Ingresos",
  CLIENT: "Cliente",
};

function normalizeName(input: string) {
  return input.trim().replace(/\s+/g, " ").toUpperCase();
}

function isTextInput(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || (t as any).isContentEditable;
}

export default function AccountsPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [filter, setFilter] = useState<"ALL" | AccountType>("ALL");
  const [includeInactive, setIncludeInactive] = useState(false);

  const [newType, setNewType] = useState<"CASH" | "BANK">("BANK");
  const [newName, setNewName] = useState("");

  const nameRef = useRef<HTMLInputElement | null>(null);

  const visible = useMemo(() => {
    return rows.filter((a) => {
      if (filter !== "ALL" && a.type !== filter) return false;
      if (!includeInactive && !a.isActive) return false;
      return true;
    });
  }, [rows, filter, includeInactive]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Account[]>("/api/accounts?includeInactive=true");
      // Orden: sistema primero + tipo + nombre
      const sorted = [...data].sort((a, b) => {
        const sysA = a.name === "CAJA" || a.name === "INGRESOS HONORARIOS" ? 0 : 1;
        const sysB = b.name === "CAJA" || b.name === "INGRESOS HONORARIOS" ? 0 : 1;
        if (sysA !== sysB) return sysA - sysB;
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.name.localeCompare(b.name);
      });
      setRows(sorted);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar cuentas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Hotkeys: ESC back, Ctrl/Cmd+K focus, R refresh
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // ESC volver al menú
      if (e.key === "Escape") {
        e.preventDefault();
        navigate("/");
        return;
      }

      // Ctrl/Cmd + K -> focus input
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        nameRef.current?.focus();
        return;
      }

      // Si está escribiendo, no interceptamos (salvo Ctrl/Cmd+K)
      if (isTextInput(e.target)) return;

      // R -> refrescar
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        load();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  async function createAccount() {
    setError(null);
    setNotice(null);

    const name = normalizeName(newName);
    if (!name) {
      setError("El nombre es obligatorio.");
      nameRef.current?.focus();
      return;
    }

    // Regla UX: CAJA no la creamos manualmente (ya viene por default)
    if (newType === "CASH" && name === "CAJA") {
      setError("CAJA ya existe como cuenta del sistema.");
      return;
    }

    try {
      const created = await apiFetch<Account>("/api/accounts", {
        method: "POST",
        body: JSON.stringify({ name, type: newType }),
      });

      setRows((prev) => {
        const next = [created, ...prev];
        // re-sort
        return next.sort((a, b) => {
          const sysA = a.name === "CAJA" || a.name === "INGRESOS HONORARIOS" ? 0 : 1;
          const sysB = b.name === "CAJA" || b.name === "INGRESOS HONORARIOS" ? 0 : 1;
          if (sysA !== sysB) return sysA - sysB;
          if (a.type !== b.type) return a.type.localeCompare(b.type);
          return a.name.localeCompare(b.name);
        });
      });

      setNewName("");
      setNotice("Cuenta creada.");
    } catch (e: any) {
      setError(e?.message ?? "No se pudo crear la cuenta");
    }
  }

  async function renameBank(account: Account) {
    setError(null);
    setNotice(null);

    const next = prompt("Nuevo nombre de la cuenta:", account.name);
    if (next === null) return;

    const name = normalizeName(next);
    if (!name) return;

    try {
      const updated = await apiFetch<Account>(`/api/accounts/${account.id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      });

      setRows((prev) => prev.map((a) => (a.id === account.id ? { ...a, ...updated } : a)));
      setNotice("Cuenta renombrada.");
    } catch (e: any) {
      setError(e?.message ?? "No se pudo renombrar");
    }
  }

  async function deactivate(account: Account) {
    setError(null);
    setNotice(null);

    if (!confirm(`¿Desactivar "${account.name}"?`)) return;

    try {
      await apiFetch(`/api/accounts/${account.id}`, { method: "DELETE" });
      setRows((prev) => prev.map((a) => (a.id === account.id ? { ...a, isActive: false } : a)));
      setNotice("Cuenta desactivada.");
    } catch (e: any) {
      setError(e?.message ?? "No se pudo desactivar");
    }
  }

  function isSystem(a: Account) {
    return a.name === "CAJA" || a.name === "INGRESOS HONORARIOS";
  }

  function canRename(a: Account) {
    // solo bancos editables
    return a.type === "BANK" && a.isActive;
  }

  function canDeactivate(a: Account) {
    // no desactivar CAJA ni INCOME ni CLIENT
    if (!a.isActive) return false;
    if (a.name === "CAJA") return false;
    if (a.type === "INCOME" || a.type === "CLIENT") return false;
    // cash (no CAJA) y bank sí
    return a.type === "BANK" || a.type === "CASH";
  }

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <button className="btn btn-ghost" onClick={() => navigate("/")}>
            ← Menú
          </button>
          <div>
            <div className="title">Cuentas</div>
            <div className="subtitle">
              Administrá tus cuentas propias (Caja y Bancos).{" "}
              <span className="kbd">ESC</span> menú · <span className="kbd">Ctrl</span>+<span className="kbd">K</span>{" "}
              buscar · <span className="kbd">R</span> refrescar
            </div>
          </div>
        </div>

        <div className="topbar-right">
          <button className="btn" onClick={load}>
            Refrescar
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-ok">{notice}</div>}

      {/* Create + Filters */}
      <div className="grid">
        <div className="card">
          <div className="card-title">Nueva cuenta</div>
          <div className="row">
            <select
              className="control"
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
            >
              <option value="BANK">Banco</option>
              <option value="CASH">Caja</option>
            </select>

            <input
              ref={nameRef}
              className="control"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={newType === "BANK" ? "Ej: BANCO MACRO" : "Ej: CAJA CHICA"}
              onKeyDown={(e) => {
                if (e.key === "Enter") createAccount();
              }}
            />

            <button className="btn btn-primary" onClick={createAccount}>
              Crear
            </button>
          </div>

          <div className="hint">
            Tip: el nombre se normaliza en MAYÚSCULAS. CAJA e INGRESOS HONORARIOS son cuentas del sistema.
          </div>
        </div>

        <div className="card">
          <div className="card-title">Filtros</div>

          <div className="row">
            <select className="control" value={filter} onChange={(e) => setFilter(e.target.value as any)}>
              <option value="ALL">Todos</option>
              <option value="BANK">Bancos</option>
              <option value="CASH">Cajas</option>
              <option value="INCOME">Ingresos</option>
              <option value="CLIENT">Clientes</option>
            </select>

            <label className="check">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              Mostrar inactivas
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="card">
        <div className="card-title">Listado</div>

        {loading ? (
          <div className="empty">Cargando…</div>
        ) : visible.length === 0 ? (
          <div className="empty">No hay cuentas para mostrar.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((a) => (
                    <tr key={a.id} className={!a.isActive ? "muted" : ""}>
                      <td>
                        <div className="name">
                          {a.name}
                          {isSystem(a) && <span className="badge">Sistema</span>}
                        </div>
                        {a.type === "CLIENT" && a.clientId && (
                          <div className="sub">Vinculada a cliente</div>
                        )}
                      </td>
                      <td>{TYPE_LABEL[a.type]}</td>
                      <td>{a.isActive ? "Activa" : "Inactiva"}</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="actions">
                          <button
                            className="btn btn-ghost"
                            disabled={!canRename(a)}
                            onClick={() => renameBank(a)}
                            title={a.type !== "BANK" ? "Solo bancos" : "Renombrar"}
                          >
                            Renombrar
                          </button>

                          <button
                            className="btn btn-danger"
                            disabled={!canDeactivate(a)}
                            onClick={() => deactivate(a)}
                            title={a.name === "CAJA" ? "CAJA no se desactiva" : "Desactivar"}
                          >
                            Desactivar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="cards">
              {visible.map((a) => (
                <div key={a.id} className={`mini ${!a.isActive ? "muted" : ""}`}>
                  <div className="mini-top">
                    <div>
                      <div className="mini-name">
                        {a.name} {isSystem(a) && <span className="badge">Sistema</span>}
                      </div>
                      <div className="mini-meta">
                        {TYPE_LABEL[a.type]} · {a.isActive ? "Activa" : "Inactiva"}
                      </div>
                    </div>
                  </div>

                  <div className="mini-actions">
                    <button className="btn btn-ghost" disabled={!canRename(a)} onClick={() => renameBank(a)}>
                      Renombrar
                    </button>
                    <button className="btn btn-danger" disabled={!canDeactivate(a)} onClick={() => deactivate(a)}>
                      Desactivar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 18,
    maxWidth: 1100,
    margin: "0 auto",
    fontFamily: "system-ui",
  },
};

const css = `
.topbar{
  display:flex; align-items:flex-start; justify-content:space-between;
  gap:12px; padding:12px 12px 6px 12px;
}
.topbar-left{ display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap; }
.topbar-right{ display:flex; gap:8px; }

.title{ font-size:26px; font-weight:900; line-height:1.1; }
.subtitle{ margin-top:6px; color:#666; font-size:13px; }
.kbd{ font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12px; padding:2px 6px; border:1px solid #ddd; border-radius:6px; background:#fafafa; }

.grid{ display:grid; grid-template-columns: 1.2fr 0.8fr; gap:12px; margin-top:10px; }
@media (max-width: 900px){
  .grid{ grid-template-columns: 1fr; }
}

.card{
  border:1px solid #e7e7e7; border-radius:14px; background:white;
  padding:14px; box-shadow: 0 10px 30px rgba(0,0,0,0.04);
}
.card-title{ font-weight:900; margin-bottom:10px; }

.row{
  display:flex; gap:10px; align-items:center; flex-wrap:wrap;
}
.control{
  height:38px; padding:0 10px; border:1px solid #ddd; border-radius:10px;
  background:white; min-width: 160px; outline:none;
}
.control:focus{ border-color:#c7c7c7; box-shadow: 0 0 0 3px rgba(0,0,0,0.04); }
.hint{ margin-top:10px; color:#777; font-size:12px; }

.check{ display:flex; gap:8px; align-items:center; color:#444; font-size:14px; }

.btn{
  height:38px; padding:0 12px; border-radius:10px; border:1px solid #ddd;
  background:white; cursor:pointer; font-weight:700;
}
.btn:hover{ background:#fafafa; }
.btn:disabled{ opacity:0.5; cursor:not-allowed; }
.btn-primary{
  border-color:#111; background:#111; color:white;
}
.btn-primary:hover{ background:#222; }
.btn-ghost{ background:white; }
.btn-danger{
  border-color:#d22; color:#d22; background:white;
}
.btn-danger:hover{ background:#fff0f0; }

.alert{
  margin-top:8px; padding:10px 12px; border-radius:12px; font-weight:700;
  border:1px solid #eee;
}
.alert-error{ background:#ffecec; border-color:#ffbdbd; color:#7a1010; }
.alert-ok{ background:#ecfff2; border-color:#b7f0c7; color:#0c5a25; }

.table-wrap{ margin-top:8px; overflow:auto; border-radius:12px; border:1px solid #eee; }
.table{ width:100%; border-collapse:collapse; }
.table thead th{
  text-align:left; font-size:13px; color:#444; background:#fafafa;
  padding:10px; border-bottom:1px solid #eee;
}
.table tbody td{
  padding:12px 10px; border-bottom:1px solid #f0f0f0; vertical-align:middle;
}
.muted{ opacity:0.55; }

.name{ display:flex; gap:8px; align-items:center; font-weight:900; }
.sub{ margin-top:4px; font-size:12px; color:#777; }

.badge{
  font-size:11px; font-weight:900; padding:3px 8px; border-radius:999px;
  border:1px solid #ddd; background:#fafafa; color:#444;
}

.actions{ display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap; }

.empty{ padding:14px; color:#666; }

.cards{ display:none; margin-top:10px; }
@media (max-width: 720px){
  .table-wrap{ display:none; }
  .cards{ display:grid; gap:10px; }
}
.mini{
  border:1px solid #eee; border-radius:14px; padding:12px; background:white;
}
.mini-top{ display:flex; justify-content:space-between; gap:10px; }
.mini-name{ font-weight:900; }
.mini-meta{ margin-top:4px; color:#666; font-size:13px; }
.mini-actions{ margin-top:10px; display:flex; gap:8px; }
`;
