import type { Me } from "../auth/useAuth";

export default function Dashboard({ me, onLogout }: { me: Me; onLogout: () => void }) {
  return (
    <div style={{ padding: 30, fontFamily: "system-ui" }}>
      <h1>Proyecto Caja</h1>
      <p>Logueado como <b>{me.email}</b></p>
      <p>User ID: {me.sub}</p>
      <button onClick={onLogout}>Cerrar sesión</button>
    </div>
  );
}
