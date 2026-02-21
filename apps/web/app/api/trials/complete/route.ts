import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  completeTrialRequestSchema,
  type CompleteTrialResponse,
} from "@/src/lib/validations/trial";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = completeTrialRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { trialId, outcome, naturalness, audioQuality } = parsed.data;

  const trial = await prisma.trial.findUnique({
    where: { id: trialId },
  });

  if (!trial) {
    return NextResponse.json(
      { error: "Trial not found" },
      { status: 404 }
    );
  }

  if (trial.outcome !== null) {
    return NextResponse.json(
      { error: "Trial already completed" },
      { status: 409 }
    );
  }

  const updated = await prisma.trial.update({
    where: { id: trialId },
    data: {
      outcome,
      naturalness,
      audioQuality,
      endedAt: new Date(),
    },
  });

  const responseBody: CompleteTrialResponse = {
    trialId: updated.id,
    outcome: updated.outcome!,
    naturalness: updated.naturalness!,
    audioQuality: updated.audioQuality!,
  };

  return NextResponse.json(responseBody);
}
