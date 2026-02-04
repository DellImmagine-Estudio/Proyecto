import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type DraftClient = {
  razonSocial: string;
  cuit: string;
  tipoPersona: "JURIDICA" | "FISICA";
};

export default function ClientsPage() {
  const navigate = useNavigate();
  const razonRef = useRef<HTMLInputElement | null>(null);

  const [draft, setDraft] = useState<DraftClient>({
    razonSocial: "",
    cuit: "",
    tipoPersona: "JURIDICA",
  });

  const [query, setQuery] = useState("");

  useEffect(() => {
    // autofocus
    razonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const typing = tag === "input" || tag === "textarea";

      // ESC: volver al menú (siempre)
      if (e.key === "Escape") {
        e.preventDefault();
        navigate("/");
        return;
      }

      // Atajo 1: enfocar Razón Social (solo si no estás escribiendo en otro input)
      if (!typing && e.key === "1") {
        e.preventDefault();
        razonRef.current?.focus();
        return;
      }

      // Ctrl+Enter: simular "Crear"
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleCreatePlaceholder();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, draft]);

  function handleCreatePlaceholder() {
    if (!draft.razonSocial.trim()) {
      alert("Ingresá Razón Social (placeholder).");
      razonRef.current?.focus();
      return;
    }

    // Placeholder: después esto va a pegarle al backend /clients
    console.log("CREATE CLIENT (placeholder):", draft);
    alert(`Cliente creado (placeholder): ${draft.razonSocial}`);

    setDraft({ razonSocial: "", cuit: "", tipoPersona: "JURIDICA" });
    razonRef.current?.focus();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: 16,
        fontFamily: "system-ui",
        background: "#fafafa",
      }}
    >
      <div style={{ width: "100%", maxWidth: 980 }}>
        {/* Top bar */}
        <div
          style={{
            background: "white",
            border: "1px solid #e5e5e5",
            borderRadius: 16,
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>ABM Clientes</h2>
            <div style={{ marginTop: 6, color: "#777", fontSize: 14 }}>
              Atajos: <b>Esc</b> volver · <b>1</b> foco Razón Social · <b>Ctrl+Enter</b> crear
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
          >
            Volver (Esc)
          </button>
        </div>

        {/* Main grid */}
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 14,
          }}
        >
          {/* Crear cliente */}
          <div
            style={{
              background: "white",
              border: "1px solid #e5e5e5",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Nuevo cliente (placeholder)</div>

            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#555" }}>Razón social</span>
                <input
                  ref={razonRef}
                  value={draft.razonSocial}
                  onChange={(e) => setDraft((d) => ({ ...d, razonSocial: e.target.value }))}
                  placeholder="Ej: VAL BIS S.A."
                  style={{
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#555" }}>CUIT (opcional)</span>
                <input
                  value={draft.cuit}
                  onChange={(e) => setDraft((d) => ({ ...d, cuit: e.target.value }))}
                  placeholder="Ej: 30-70905673-1"
                  style={{
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#555" }}>Tipo de persona</span>
                <select
                  value={draft.tipoPersona}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, tipoPersona: e.target.value as DraftClient["tipoPersona"] }))
                  }
                  style={{
                    height: 38,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    outline: "none",
                    background: "white",
                  }}
                >
                  <option value="JURIDICA">Jurídica</option>
                  <option value="FISICA">Física</option>
                </select>
              </label>

              <button
                onClick={handleCreatePlaceholder}
                style={{
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Crear (placeholder)
              </button>
            </div>
          </div>

          {/* Lista (placeholder) */}
          <div
            style={{
              background: "white",
              border: "1px solid #e5e5e5",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 900 }}>Listado (placeholder)</div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar… (placeholder)"
                style={{
                  height: 34,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  outline: "none",
                  minWidth: 220,
                }}
              />
            </div>

            <div style={{ marginTop: 12, color: "#666", fontSize: 14, lineHeight: 1.4 }}>
              Acá va a ir la tabla real conectada a la DB (<code>/clients</code>).
              <br />
              Por ahora dejamos una maqueta.
            </div>

            <div
              style={{
                marginTop: 14,
                border: "1px dashed #bbb",
                borderRadius: 14,
                padding: 14,
                color: "#777",
                fontSize: 14,
              }}
            >
              <div style={{ fontWeight: 800, color: "#555" }}>Ejemplos que vamos a mostrar</div>
              <ul style={{ margin: "10px 0 0 18px" }}>
                <li>VAL BIS S.A. — 30-70905673-1</li>
                <li>SODERIA RIENZO — 30-71407455-1</li>
                <li>DI IORIO, LAURA — (sin CUIT)</li>
              </ul>

              <div style={{ marginTop: 10, fontSize: 12 }}>
                (Cuando esté el backend, el buscador filtra por razón social / CUIT.)
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, color: "#888", fontSize: 12 }}>
          Nota: el “Crear” ahora es placeholder. En el próximo paso lo conectamos a Prisma + endpoint protegido.
        </div>
      </div>
    </div>
  );
}
