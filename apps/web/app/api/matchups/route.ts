import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import type { CreateMatchupResponse } from "@/src/lib/validations/matchup";

const GPU_API_ENDPOINT = process.env.GPU_API_ENDPOINT || "";

export async function POST() {
  try {
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

    // AWS GPU モードが設定されている場合、GPU セッションを起動
    let gpuSessionIds: { a?: string; b?: string } = {};
    if (GPU_API_ENDPOINT) {
      try {
        const [sessionA, sessionB] = await Promise.all([
          startGpuSession(GPU_API_ENDPOINT, modelA.name, 8998),
          startGpuSession(GPU_API_ENDPOINT, modelB.name, 8999),
        ]);
        gpuSessionIds = { a: sessionA.sessionId, b: sessionB.sessionId };
      } catch (e) {
        console.error("Failed to start GPU sessions:", e);
        // GPU 起動失敗時は従来の endpointUrl にフォールバック
      }
    }

    const body: CreateMatchupResponse = {
      matchupId: result.matchup.id,
      workerId: result.worker.id,
      arms: [
        {
          armId: result.armA.id,
          slot: "A",
          endpointUrl: modelA.endpointUrl,
          trialsRequired: result.armA.trialsRequired,
          ...(gpuSessionIds.a && { gpuSessionId: gpuSessionIds.a }),
        },
        {
          armId: result.armB.id,
          slot: "B",
          endpointUrl: modelB.endpointUrl,
          trialsRequired: result.armB.trialsRequired,
          ...(gpuSessionIds.b && { gpuSessionId: gpuSessionIds.b }),
        },
      ],
    };

    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    console.error("POST /api/matchups error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

async function startGpuSession(apiEndpoint: string, modelName: string, port: number) {
  // モデル名から HuggingFace リポジトリ名を生成
  const modelRepo = `abePclWaseda/${modelName}`;
  const res = await fetch(`${apiEndpoint}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelRepo, port }),
  });
  if (!res.ok) throw new Error(`GPU session start failed: ${res.status}`);
  return res.json();
}
