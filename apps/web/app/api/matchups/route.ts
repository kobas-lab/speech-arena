import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import type { CreateMatchupResponse } from "@/src/lib/validations/matchup";

export async function POST() {
  const activeModels = await prisma.model.findMany({
    where: { isActive: true },
  });

  if (activeModels.length < 2) {
    return NextResponse.json(
      { error: "Not enough active models" },
      { status: 409 }
    );
  }

  const shuffled = [...activeModels].sort(() => Math.random() - 0.5);
  const [modelA, modelB] = shuffled;

  const result = await prisma.$transaction(async (tx) => {
    const worker = await tx.worker.create({ data: {} });
    const matchup = await tx.matchup.create({
      data: { workerId: worker.id },
    });
    const armA = await tx.matchupArm.create({
      data: { matchupId: matchup.id, modelId: modelA.id, slot: "A" },
    });
    const armB = await tx.matchupArm.create({
      data: { matchupId: matchup.id, modelId: modelB.id, slot: "B" },
    });
    return { worker, matchup, armA, armB };
  });

  const body: CreateMatchupResponse = {
    matchupId: result.matchup.id,
    workerId: result.worker.id,
    arms: [
      {
        armId: result.armA.id,
        slot: "A",
        endpointUrl: modelA.endpointUrl,
        trialsRequired: result.armA.trialsRequired,
      },
      {
        armId: result.armB.id,
        slot: "B",
        endpointUrl: modelB.endpointUrl,
        trialsRequired: result.armB.trialsRequired,
      },
    ],
  };

  return NextResponse.json(body, { status: 201 });
}
