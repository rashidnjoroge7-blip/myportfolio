import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env.local" });

// Prisma Client generation and schema validation do not connect to PostgreSQL.
// Keep CI/Preview builds independent of branch-scoped database credentials.
// Database commands (migrate, db push, studio, etc.) still require DIRECT_URL.
const schemaOnlyCommands = new Set(["generate", "validate", "format"]);
const isSchemaOnlyCommand = process.argv.some((argument) =>
  schemaOnlyCommands.has(argument),
);
const schemaGenerationUrl =
  "postgresql://schema-generation:local-only@127.0.0.1:5432/schema_generation";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url:
      process.env.DIRECT_URL ||
      (isSchemaOnlyCommand ? schemaGenerationUrl : env("DIRECT_URL")),
  },
});
