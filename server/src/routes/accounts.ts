import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

const ACCOUNT_TYPES = ["CLIENT", "CASH", "BANK", "INCOME"] as const;
type AccountType = (typeof ACCOUNT_TYPES)[number];

function isAccountType(x: any): x is AccountType {
  return typeof x === "string" && (ACCOUNT_TYPES as readonly string[]).includes(x);
}

/**
 * Con Opción A, app.authenticate ya corrió antes (preHandler),
 * así que request.user debería existir.
 * En tu proyecto, el id viene en user.sub (no user.id).
 */
function requireUserId(req: FastifyRequest, reply: FastifyReply): string {
  const anyReq = req as any;
  const user = anyReq.user ?? null;

  const userId = user?.sub; // ✅ IMPORTANTE: sub, no id
  if (!userId) {
    // Si por algún motivo no pasó authenticate, igual devolvemos 401.
    reply.code(401);
    throw new Error("Unauthorized");
  }
  return userId as string;
}

export async function accountsRoutes(app: FastifyInstance) {
  // GET /accounts?type=BANK&includeInactive=true
  app.get(
    "/accounts",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const userId = requireUserId(req, reply);

      const q = (req.query as any) ?? {};
      const includeInactive = q.includeInactive === "true";
      const type = q.type;

      const where: any = { userId };
      if (!includeInactive) where.isActive = true;
      if (type && isAccountType(type)) where.type = type;

      return app.prisma.account.findMany({
        where,
        orderBy: [{ type: "asc" }, { name: "asc" }],
        select: { id: true, name: true, type: true, isActive: true, clientId: true },
      });
    }
  );

  // POST /accounts
  app.post(
    "/accounts",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const userId = requireUserId(req, reply);
      const body = (req.body as any) ?? {};

      const name = typeof body.name === "string" ? body.name.trim() : "";
      const type = body.type;
      const clientId = body.clientId;

      if (!name) return reply.code(400).send({ error: "name es obligatorio" });
      if (!isAccountType(type)) return reply.code(400).send({ error: "type inválido" });

      if (type === "CLIENT" && (!clientId || typeof clientId !== "string")) {
        return reply
          .code(400)
          .send({ error: "clientId es obligatorio cuando type=CLIENT" });
      }
      if (type !== "CLIENT" && clientId) {
        return reply
          .code(400)
          .send({ error: "clientId solo se permite cuando type=CLIENT" });
      }

      try {
        const created = await app.prisma.account.create({
          data: {
            userId,
            name,
            type,
            clientId: type === "CLIENT" ? clientId : null,
          },
          select: { id: true, name: true, type: true, isActive: true, clientId: true },
        });
        return reply.code(201).send(created);
      } catch (e: any) {
        if (e?.code === "P2002") {
          return reply.code(409).send({ error: "Cuenta duplicada (nombre o clientId)" });
        }
        throw e;
      }
    }
  );

  // PUT /accounts/:id (renombrar o activar/desactivar)
  app.put(
    "/accounts/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const userId = requireUserId(req, reply);
      const { id } = req.params as any;
      const body = (req.body as any) ?? {};

      const existing = await app.prisma.account.findFirst({
        where: { id, userId },
        select: { id: true, type: true },
      });
      if (!existing) return reply.code(404).send({ error: "Cuenta no encontrada" });

      const data: any = {};
      if (typeof body.name === "string") data.name = body.name.trim();
      if (typeof body.isActive === "boolean") data.isActive = body.isActive;

      if (data.name !== undefined && !data.name) {
        return reply.code(400).send({ error: "name no puede ser vacío" });
      }

      // Regla: no renombrar CLIENT/INCOME desde acá (si querés permitirlo, lo sacamos)
      if (data.name && (existing.type === "CLIENT" || existing.type === "INCOME")) {
        return reply.code(400).send({
          error: "No se puede renombrar CLIENT/INCOME desde este endpoint",
        });
      }

      try {
        const updated = await app.prisma.account.update({
          where: { id },
          data,
          select: { id: true, name: true, type: true, isActive: true, clientId: true },
        });
        return reply.send(updated);
      } catch (e: any) {
        if (e?.code === "P2002") {
          return reply.code(409).send({ error: "Nombre de cuenta ya existe" });
        }
        throw e;
      }
    }
  );

  // DELETE /accounts/:id => soft delete (isActive=false)
  app.delete(
    "/accounts/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const userId = requireUserId(req, reply);
      const { id } = req.params as any;

      const existing = await app.prisma.account.findFirst({
        where: { id, userId },
        select: { id: true, type: true },
      });
      if (!existing) return reply.code(404).send({ error: "Cuenta no encontrada" });

      // Regla: no desactivar CLIENT/INCOME desde acá
      if (existing.type === "CLIENT" || existing.type === "INCOME") {
        return reply.code(400).send({
          error: "No se puede desactivar cuentas CLIENT/INCOME desde aquí",
        });
      }

      const updated = await app.prisma.account.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, name: true, type: true, isActive: true },
      });

      return reply.send(updated);
    }
  );
}
