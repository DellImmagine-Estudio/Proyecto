import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";

import prismaPlugin from "./plugins/prisma";
import jwtPlugin from "./plugins/jwt";
import { usersRoutes } from "./routes/users";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

// plugins primero
await app.register(prismaPlugin);
await app.register(jwtPlugin);

// rutas después
await app.register(usersRoutes);

app.get("/health", async () => {
  return { ok: true, service: "caja-server" };
});

const PORT = Number(process.env.PORT ?? 3001);

await app.listen({ port: PORT, host: "0.0.0.0" });
