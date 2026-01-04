import { defineConfig, env } from "prisma/config"
import { config as loadEnv } from "dotenv"

loadEnv({ path: ".env.local" })
loadEnv()

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Prisma CLI (migrations/introspection) should use the direct DB URL.
    // Runtime queries use `DATABASE_URL` via the Pg driver adapter in `lib/prisma.ts`.
    url: env("DIRECT_URL"),
  },
})
