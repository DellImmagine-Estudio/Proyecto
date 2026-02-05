import type { PrismaClient } from "@prisma/client";

export async function ensureDefaultAccounts(prisma: PrismaClient, userId: string) {
  // CAJA
  await prisma.account.upsert({
    where: { userId_name: { userId, name: "CAJA" } },
    update: { isActive: true, type: "CASH" },
    create: { userId, name: "CAJA", type: "CASH" },
  });

  // INGRESOS HONORARIOS
  await prisma.account.upsert({
    where: { userId_name: { userId, name: "INGRESOS HONORARIOS" } },
    update: { isActive: true, type: "INCOME" },
    create: { userId, name: "INGRESOS HONORARIOS", type: "INCOME" },
  });
}
