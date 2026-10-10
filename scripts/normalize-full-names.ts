import { PrismaClient } from "@prisma/client";
import { normalizeBackName, normalizeFullName } from "../src/lib/validations";

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.jerseyOrder.findMany({
    select: { id: true, fullName: true, backName: true },
  });
  let updated = 0;

  for (const order of orders) {
    const normalized = normalizeFullName(order.fullName);
    const normalizedBackName = normalizeBackName(order.backName);
    if (normalized === order.fullName && normalizedBackName === order.backName) continue;

    await prisma.jerseyOrder.update({
      where: { id: order.id },
      data: { fullName: normalized, backName: normalizedBackName },
    });
    updated += 1;
  }

  console.log(`Data diperiksa: ${orders.length}; diperbarui: ${updated}.`);
}

main()
  .catch((error) => {
    console.error("Gagal menormalisasi nama:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
