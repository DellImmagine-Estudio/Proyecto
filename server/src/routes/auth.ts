import type { FastifyInstance } from "fastify";
import { ensureDefaultAccounts } from "../services/ensureDefaultAccounts";
import bcrypt from "bcryptjs";

export async function authRoutes(app: FastifyInstance) {
  // LOGIN -> /auth/login
  app.post("/auth/login", async (request, reply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    const user = await app.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.code(401).send({ error: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return reply.code(401).send({ error: "Credenciales inválidas" });
    }

    // 🔑 asegura CAJA + INGRESOS HONORARIOS
    await ensureDefaultAccounts(app.prisma, user.id);

    const token = app.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    reply.setCookie("access_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // secure: true, // prod
    });

    return reply.send({
      ok: true,
      user: { id: user.id, email: user.email, role: user.role },
    });
  });

  // LOGOUT -> /auth/logout
  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie("access_token", { path: "/" });
    return reply.send({ ok: true });
  });

  // ME -> /auth/me
  app.get(
    "/auth/me",
    { preHandler: app.authenticate },
    async (request: any, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "unauthorized" });

      // 🔑 asegura defaults también acá (por si el user existía antes)
      await ensureDefaultAccounts(app.prisma, userId);

      const user = await app.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, createdAt: true },
      });

      if (!user) return reply.code(401).send({ error: "unauthorized" });

      return reply.send({ ok: true, user });
    }
  );
}
