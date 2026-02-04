import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import "dotenv/config";

import prismaPlugin from "./plugins/prisma";
import jwtPlugin from "./plugins/jwt";

import { adminUsersRoutes } from "./routes/adminUsers";
import { authRoutes } from "./routes/auth";
import { clientsRoutes } from "./routes/clients"; // si ya lo creaste

const app = Fastify({ logger: true });

// 1) plugins globales
await app.register(cors, {
  origin: ["http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});


await app.register(cookie, {
  secret: process.env.COOKIE_SECRET,
});

// 2) plugins de app
await app.register(prismaPlugin);
await app.register(jwtPlugin);

// 3) rutas
await app.register(authRoutes);
await app.register(clientsRoutes);

await app.register(adminUsersRoutes);

// 4) rutas sueltas (si querés)
app.get("/health", async () => ({ ok: true, service: "caja-server" }));

// 5) listen AL FINAL
const PORT = Number(process.env.PORT ?? 3001);
await app.listen({ port: PORT, host: "0.0.0.0" });
