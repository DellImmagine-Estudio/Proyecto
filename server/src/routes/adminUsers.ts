import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { requireAdmin } from "../plugins/requireAdmin";

export async function adminUsersRoutes(app: FastifyInstance) {
  app.post(
    "/admin/users",
    {
      preHandler: [app.authenticate, requireAdmin(app)],
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string" },
            password: { type: "string", minLength: 6 },
            role: { type: "string", enum: ["ADMIN", "USER"] },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        email: string;
        password: string;
        role?: "ADMIN" | "USER";
      };

      const email = body.email.toLowerCase().trim();
      const hash = await bcrypt.hash(body.password, 10);

      const user = await app.prisma.user.create({
        data: {
          email,
          password: hash,
          role: body.role ?? "USER",
        },
        select: { id: true, email: true, role: true, createdAt: true },
      });

      return reply.status(201).send({ ok: true, user });
    },
  );
  app.get(
    "/admin/users",
    {
      preHandler: [app.authenticate, requireAdmin(app)],
    },
    async (req, reply) => {
      const users = await app.prisma.user.findMany({
        select: { id: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
      return reply.send({ ok: true, users });
    },
  );
}
