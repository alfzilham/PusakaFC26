import { PrismaClient } from "@prisma/client";
import { normalizeFullName } from "../src/lib/validations";

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.jerseyOrder.findMany({
    select: { id: true, fullName: true },
  });
  let updated = 0;

  for (const order of orders) {
    const normalized = normalizeFullName(order.fullName);
    if (normalized === order.fullName) continue;

    await prisma.jerseyOrder.update({
      where: { id: order.id },
      data: { fullName: normalized },
    });
    updated += 1;
  }

  console.log(`Nama diperiksa: ${orders.length}; diperbarui: ${updated}.`);
}

main()
  .catch((error) => {
    console.error("Gagal menormalisasi nama:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
