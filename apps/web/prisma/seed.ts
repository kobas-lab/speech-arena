import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const models = [
    {
      name: "moshi-base",
      endpointUrl: "https://now-ent-petroleum-debate.trycloudflare.com",
      description: "Moshi baseline model",
    },
    {
      name: "moshi-finetuned",
      endpointUrl: "https://now-ent-petroleum-debate.trycloudflare.com",
      description: "Moshi fine-tuned model",
    },
  ];

  for (const model of models) {
    await prisma.model.upsert({
      where: { name: model.name },
      update: { endpointUrl: model.endpointUrl, description: model.description },
      create: model,
    });
    console.log(`Upserted model: ${model.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
