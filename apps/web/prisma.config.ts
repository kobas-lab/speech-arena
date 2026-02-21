import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // マイグレーションは直接接続（PgBouncer非経由）が必要
    url: process.env["DIRECT_URL"],
  },
});
