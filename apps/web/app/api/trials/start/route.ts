import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  startTrialRequestSchema,
  type StartTrialResponse,
} from "@/src/lib/validations/trial";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = startTrialRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { matchupId, armId, trialIndex } = parsed.data;

  const matchup = await prisma.matchup.findUnique({
    where: { id: matchupId },
  });

  if (!matchup) {
    return NextResponse.json(
      { error: "Matchup not found" },
      { status: 404 }
    );
  }

  if (matchup.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Matchup is not in progress" },
      { status: 409 }
    );
  }

  const arm = await prisma.matchupArm.findUnique({
    where: { id: armId },
    include: { model: true },
  });

  if (!arm || arm.matchupId !== matchupId) {
    return NextResponse.json(
      { error: "Arm not found or does not belong to this matchup" },
      { status: 404 }
    );
  }

  if (trialIndex > arm.trialsRequired) {
    return NextResponse.json(
      { error: "Trial index exceeds trials required" },
      { status: 400 }
    );
  }

  const trial = await prisma.trial.create({
    data: {
      trialIndex,
      matchupId,
      armId,
    },
  });

  const responseBody: StartTrialResponse = {
    trialId: trial.id,
    endpointUrl: arm.model.endpointUrl,
  };

  return NextResponse.json(responseBody, { status: 201 });
}
