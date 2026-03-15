import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// モデル定義
// endpointUrl は環境変数 MODEL_<name>_URL で上書き可能
// 例: MODEL_A_URL=https://xxx.trycloudflare.com MODEL_B_URL=https://yyy.trycloudflare.com npx tsx prisma/seed.ts
const ALL_MODELS = [
  {
    name: "llm-jp-moshi-v1",
    envKey: "MODEL_A_URL",
    description: "LLM-jp Moshi v1 ベースライン",
  },
  {
    name: "llm-jp-moshi-v1.1-vb-pseudo",
    envKey: "MODEL_B_URL",
    description: "LLM-jp Moshi v1.1 VB pseudo",
  },
  {
    name: "llm-jp-moshi-v1.1-all-mixed",
    envKey: "MODEL_C_URL",
    description: "LLM-jp Moshi v1.1 all mixed",
  },
  {
    name: "llm-jp-moshi-v1.1-all-staged",
    envKey: "MODEL_D_URL",
    description: "LLM-jp Moshi v1.1 all staged",
  },
];

async function main() {
  for (const model of ALL_MODELS) {
    const endpointUrl = process.env[model.envKey];

    if (endpointUrl) {
      // URL が指定されたモデルは upsert して isActive = true
      await prisma.model.upsert({
        where: { name: model.name },
        update: { endpointUrl, description: model.description, isActive: true },
        create: { name: model.name, endpointUrl, description: model.description, isActive: true },
      });
      console.log(`✓ ${model.name}: ${endpointUrl} (active)`);
    } else {
      // URL が未指定のモデルは、既に DB にあれば isActive = false に
      const existing = await prisma.model.findUnique({ where: { name: model.name } });
      if (existing) {
        await prisma.model.update({
          where: { name: model.name },
          data: { isActive: false },
        });
        console.log(`- ${model.name}: 無効化 (inactive)`);
      } else {
        console.log(`- ${model.name}: スキップ (URL未設定)`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
