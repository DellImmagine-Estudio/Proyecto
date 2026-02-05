import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  me: { email: string; id: string };
  onLogout: () => Promise<void>;
};

type MenuItem = {
  key: string;
  title: string;
  description: string;
  path: string;
  disabled?: boolean;
};

export default function Dashboard({ me, onLogout }: Props) {
  const navigate = useNavigate();

  const items: MenuItem[] = [
    {
      key: "1",
      title: "ABM CLIENTES",
      description: "Alta / Baja / Modificación + búsqueda",
      path: "/clients",
    },
    {
      key: "2",
      title: "ABM CUENTAS",
      description: "Caja / Bancos (alta, baja, modificación)",
      path: "/accounts",
    },
    {
      key: "3",
      title: "CAJA DEL ESTUDIO (próximo)",
      description: "Movimientos / Saldos / Honorarios",
      path: "/cashbox",
      disabled: true,
    },
    {
      key: "4",
      title: "LIQUIDACIONES (próximo)",
      description: "Estados mensuales + recibos",
      path: "/payroll",
      disabled: true,
    },
  ];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      const item = items.find((x) => x.key === e.key);
      if (item && !item.disabled) navigate(item.path);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "system-ui",
        background: "#fafafa",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 860,
          background: "white",
          border: "1px solid #e5e5e5",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 240 }}>
            <h1 style={{ margin: 0, fontSize: 28 }}>Proyecto Caja</h1>
            <div style={{ marginTop: 10, color: "#444" }}>
              Logueado como <b>{me.email}</b>
            </div>
            <div style={{ marginTop: 6, color: "#777", fontSize: 14 }}>
              Atajos: presioná <b>1</b>, <b>2</b>, <b>3</b>, <b>4</b>…
            </div>
          </div>

          <button
            onClick={onLogout}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
          >
            Cerrar sesión
          </button>
        </div>

        {/* Menu grid */}
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => !it.disabled && navigate(it.path)}
              disabled={it.disabled}
              style={{
                textAlign: "left",
                padding: 16,
                borderRadius: 14,
                border: "1px solid #e6e6e6",
                background: it.disabled ? "#f6f6f6" : "white",
                cursor: it.disabled ? "not-allowed" : "pointer",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    minWidth: 34,
                    height: 34,
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    background: "#fafafa",
                  }}
                >
                  {it.key}
                </div>

                <div>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>{it.title}</div>
                  <div style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
                    {it.description}
                  </div>

                  {!it.disabled && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
                      Enter o click para abrir
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16, color: "#888", fontSize: 12 }}>
          Tip: cuando estemos avanzados, este menú va a ser el “hub” del sistema (clientes, cuentas, caja, liquidaciones).
        </div>
      </div>
    </div>
  );
}
