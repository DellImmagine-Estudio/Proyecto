import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db";


const prismaPlugin: FastifyPluginAsync = async (app) => {
  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await app.prisma.$disconnect();
  });
};

export default fp(prismaPlugin);
