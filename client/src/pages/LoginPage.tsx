import { useState } from "react";

type Props = {
  onLogin: (email: string, password: string) => Promise<void>;
};

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("martin@estudio.com");
  const [password, setPassword] = useState("Clave123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", fontFamily: "system-ui" }}>
      <h2>Proyecto Caja</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        {error && <span style={{ color: "crimson" }}>{error}</span>}
      </form>
    </div>
  );
}
