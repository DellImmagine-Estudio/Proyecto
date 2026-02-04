import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export function requireAdmin(app: FastifyInstance) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any)?.sub;
    if (!userId) return reply.status(401).send({ error: "unauthorized" });

    const me = await app.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!me) return reply.status(401).send({ error: "unauthorized" });
    if (me.role !== "ADMIN") return reply.status(403).send({ error: "forbidden" });
  };
}
