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

  // middleware reusable
  app.decorate("authenticate", async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({ error: "unauthorized" });
    }
  });
};


export default fp(jwtPlugin);
