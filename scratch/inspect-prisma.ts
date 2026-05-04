import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
console.log("Prisma keys:", Object.keys(prisma));
console.log("Categories model:", (prisma as any).categories);
console.log("Cars model:", (prisma as any).cars);
process.exit(0);
