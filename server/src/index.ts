import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import "dotenv/config";

import prismaPlugin from "./plugins/prisma";
import jwtPlugin from "./plugins/jwt";
import { authRoutes } from "./routes/auth"; // (o el nombre que uses)

const app = Fastify({ logger: true });

// IMPORTANTE: para cookies, CORS debe permitir credentials
await app.register(cors, {
  origin: ["http://localhost:5173"], // tu Vite
  credentials: true,
});

await app.register(cookie, {
  secret: process.env.COOKIE_SECRET,
});

await app.register(prismaPlugin);
await app.register(jwtPlugin);

await app.register(authRoutes);

app.get("/health", async () => {
  return { ok: true, service: "caja-server" };
});

const PORT = Number(process.env.PORT ?? 3001);
await app.listen({ port: PORT, host: "0.0.0.0" });
