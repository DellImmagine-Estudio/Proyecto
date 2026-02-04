import type { FastifyInstance } from "fastify";

type CreateClientBody = {
  razonSocial: string;
  cuit?: string;
  tipoPersona?: "JURIDICA" | "FISICA";
};

type UpdateClientBody = {
  razonSocial?: string;
  cuit?: string | null;
  tipoPersona?: "JURIDICA" | "FISICA" | null;
};

// Normaliza CUIT: deja solo dígitos y lo devuelve como 11 dígitos (o null si vacío)
function normalizeCuit(input: unknown): string | null | undefined {
  if (input === null) return null;
  if (typeof input === "undefined") return undefined;
  if (typeof input !== "string") return undefined;

  const trimmed = input.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, "");
  return digits ? digits : null;
}

export async function clientsRoutes(app: FastifyInstance) {
  // LISTAR (solo del usuario) + búsqueda opcional ?q=
  app.get("/clients", { preHandler: app.authenticate }, async (request: any) => {
    const userId = request.user.sub;
    const q = String(request.query?.q ?? "").trim();

    return app.prisma.client.findMany({
      where: {
        userId,
        ...(q
          ? {
              OR: [
                { razonSocial: { contains: q, mode: "insensitive" } },
                { cuit: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  });

  // OBTENER 1 (solo si pertenece al usuario)
  app.get(
    "/clients/:id",
    { preHandler: app.authenticate },
    async (request: any, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const client = await app.prisma.client.findFirst({
        where: { id, userId },
      });

      if (!client) return reply.status(404).send({ error: "not found" });
      return client;
    }
  );

  // CREAR
  app.post(
    "/clients",
    {
      preHandler: app.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["razonSocial"],
          additionalProperties: false,
          properties: {
            razonSocial: { type: "string", minLength: 2, maxLength: 120 },
            // permitimos con guiones o espacios; normalizamos a dígitos
            cuit: { type: "string", minLength: 0, maxLength: 20 },
            tipoPersona: { type: "string", enum: ["JURIDICA", "FISICA"] },
          },
        },
      },
    },
    async (request: any, reply) => {
      const userId = request.user.sub;
      const body = request.body as CreateClientBody;

      const razonSocial = body.razonSocial.trim();
      const cuitNormalized = normalizeCuit(body.cuit); // string|null|undefined
      const tipoPersona = body.tipoPersona ?? null;

      // Validación extra (si vino CUIT, que sea 11 dígitos)
      if (typeof cuitNormalized === "string" && cuitNormalized.length !== 11) {
        return reply.status(400).send({ error: "cuit must have 11 digits" });
      }

      try {
        const created = await app.prisma.client.create({
          data: {
            userId,
            razonSocial,
            cuit: cuitNormalized ?? null,
            tipoPersona,
          },
        });
        return reply.status(201).send(created);
      } catch (err: any) {
        if (err.code === "P2002") {
          return reply
            .status(409)
           .send({ error: "cuit already exists for this user" });

        }
        request.log.error(err);
        return reply.status(500).send({ error: "internal server error" });
      }
    }
  );

  // EDITAR (solo si pertenece al user)
  app.put(
    "/clients/:id",
    {
      preHandler: app.authenticate,
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            razonSocial: { type: "string", minLength: 2, maxLength: 120 },
            cuit: { anyOf: [{ type: "string" }, { type: "null" }] },
            tipoPersona: {
              anyOf: [
                { type: "string", enum: ["JURIDICA", "FISICA"] },
                { type: "null" },
              ],
            },
          },
        },
      },
    },
    async (request: any, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };
      const body = request.body as UpdateClientBody;

      // Aseguramos que exista y sea del usuario
      const existing = await app.prisma.client.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!existing) return reply.status(404).send({ error: "not found" });

      const razonSocial =
        typeof body.razonSocial === "string" ? body.razonSocial.trim() : undefined;

      const cuitNormalized = normalizeCuit(body.cuit); // string|null|undefined
      if (typeof cuitNormalized === "string" && cuitNormalized.length !== 11) {
        return reply.status(400).send({ error: "cuit must have 11 digits" });
      }

      const tipoPersona =
        typeof body.tipoPersona === "string"
          ? body.tipoPersona
          : body.tipoPersona === null
          ? null
          : undefined;

      try {
        const updated = await app.prisma.client.update({
          where: { id },
          data: {
            ...(razonSocial !== undefined ? { razonSocial } : {}),
            ...(cuitNormalized !== undefined ? { cuit: cuitNormalized } : {}),
            ...(tipoPersona !== undefined ? { tipoPersona } : {}),
          },
        });

        return updated;
      } catch (err: any) {
        if (err.code === "P2002") {
          return reply
            .status(409)
            .send({ error: "client with same CUIT already exists" });
        }
        request.log.error(err);
        return reply.status(500).send({ error: "internal server error" });
      }
    }
  );

  // BORRAR (solo si pertenece al user)
  app.delete(
    "/clients/:id",
    { preHandler: app.authenticate },
    async (request: any, reply) => {
      const userId = request.user.sub;
      const { id } = request.params as { id: string };

      const existing = await app.prisma.client.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!existing) return reply.status(404).send({ error: "not found" });

      await app.prisma.client.delete({ where: { id } });
      return reply.send({ ok: true });
    }
  );
}
