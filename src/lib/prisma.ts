import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL is not configured");
}

// Configure certificate verification explicitly.
const databaseUrl = new URL(connectionString);
databaseUrl.searchParams.delete("sslmode");

const certificatePath = join(
  process.cwd(),
  "certs",
  "prod-ca-2021.crt"
);

const ca = readFileSync(certificatePath, "utf8");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: databaseUrl.toString(),
    ssl: {
      ca,
      rejectUnauthorized: true,
    },
    max: 5,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

globalForPrisma.pgPool = pool;
globalForPrisma.prisma = prisma;
