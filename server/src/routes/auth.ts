import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";

export async function authRoutes(app: FastifyInstance) {
  // LOGIN -> setea cookie httpOnly (no devuelve token)
  app.post("/auth/login", async (request, reply) => {
    const body = request.body as { email?: string; password?: string };

    if (!body?.email || !body?.password) {
      return reply.status(400).send({ error: "email and password are required" });
    }

    const user = await app.prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true, email: true, password: true, createdAt: true },
    });

    if (!user) {
      return reply.status(401).send({ error: "invalid credentials" });
    }

    const validPassword = await bcrypt.compare(body.password, user.password);
    if (!validPassword) {
      return reply.status(401).send({ error: "invalid credentials" });
    }

    const token = await reply.jwtSign(
      { email: user.email },
      { sign: { sub: user.id, expiresIn: "7d" } }
    );

    // Cookie httpOnly con el JWT
    reply.setCookie("access_token", token, {
      httpOnly: true,
      sameSite: "lax", // podés subir a "strict" si tu flujo lo permite
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días (en segundos)
    });

    return reply.send({
      ok: true,
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    });
  });

  // LOGOUT -> limpia cookie
  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie("access_token", { path: "/" });
    return reply.send({ ok: true });
  });

  // ME -> valida cookie/header y devuelve user real desde DB
 app.get("/auth/me", { preHandler: app.authenticate }, async (request: any, reply) => {
  const userId = request.user?.sub;
  if (!userId) return reply.status(401).send({ error: "unauthorized" });

  const user = await app.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return reply.status(401).send({ error: "unauthorized" });
  }

  return reply.send({ ok: true, user });
});

}
