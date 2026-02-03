import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";

export async function usersRoutes(app: FastifyInstance) {
  // CREATE USER
  app.post("/users", async (request, reply) => {
    const body = request.body as { email?: string; password?: string };

    if (!body?.email || !body?.password) {
      return reply.status(400).send({ error: "email and password are required" });
    }

    try {
      const passwordHash = await bcrypt.hash(body.password, 10);

      const user = await app.prisma.user.create({
        data: { email: body.email, password: passwordHash },
        select: { id: true, email: true, createdAt: true },
      });

      return reply.status(201).send(user);
    } catch (err: any) {
      if (err.code === "P2002") {
        return reply.status(409).send({ error: "email already exists" });
      }
      request.log.error(err);
      return reply.status(500).send({ error: "internal server error" });
    }
  });

  // LOGIN -> devuelve token JWT
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

    // token: sub = userId, payload incluye email
    const token = await reply.jwtSign(
      { email: user.email },
      { sign: { sub: user.id, expiresIn: "7d" } }
    );

    return reply.send({
      ok: true,
      token,
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    });
  });

  // LIST USERS (protegido) -> opcional pero recomendado
  app.get(
    "/users",
    { preHandler: app.authenticate },
    async (request) => {
      const users = await app.prisma.user.findMany({
        select: { id: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });

      // Si querés, acá luego limitamos a "solo mi user" usando request.user.sub
      return users;
    }
  );

  // ME (para el front de login: testea token y devuelve el user del token)
  app.get(
    "/auth/me",
    { preHandler: app.authenticate },
    async (request: any) => {
      return { ok: true, user: request.user };
    }
  );
}
