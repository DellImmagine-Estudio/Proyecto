import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyPluginAsync } from "fastify";
import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { email: string };
    user: { sub: string; email: string };
  }
}

const jwtPlugin: FastifyPluginAsync = async (app) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  await app.register(jwt, { secret });

  // middleware reusable: lee cookie httpOnly o Bearer (fallback para tests)
  app.decorate("authenticate", async (request: any, reply: any) => {
    try {
      const cookieToken = request.cookies?.access_token as string | undefined;
      const auth = request.headers.authorization as string | undefined;
      const bearerToken =
        auth && auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : undefined;

      const token = cookieToken || bearerToken;
      if (!token) return reply.status(401).send({ error: "unauthorized" });

      // Verificamos explícitamente el token (en vez de depender del header)
      request.user = app.jwt.verify(token);
    } catch (err) {
      return reply.status(401).send({ error: "unauthorized" });
    }
  });
};

export default fp(jwtPlugin);
