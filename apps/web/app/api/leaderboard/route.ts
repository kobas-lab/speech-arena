import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import type { LeaderboardResponse } from "@/src/lib/validations/leaderboard";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const trialDateFilter: Record<string, Date> = {};
  if (from) trialDateFilter.gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    trialDateFilter.lte = toDate;
  }

  const models = await prisma.model.findMany({
    where: { isActive: true },
    include: {
      arms: {
        include: {
          trials: {
            where: {
              outcome: { not: null },
              ...(Object.keys(trialDateFilter).length > 0
                ? { endedAt: trialDateFilter }
                : {}),
            },
          },
        },
      },
    },
  });

  const leaderboard: LeaderboardResponse = models
    .map((model) => {
      const allTrials = model.arms.flatMap((arm) => arm.trials);
      const totalTrials = allTrials.length;

      // パケットロスありの trial を除外してスコア計算
      const trials = allTrials.filter((t) => t.hasPacketLoss !== true);
      const filteredTrials = trials.length;

      if (filteredTrials === 0) {
        return {
          modelId: model.id,
          modelName: model.name,
          successRate: 0,
          avgAcousticNaturalness: 0,
          avgPerceivedNaturalness: 0,
          avgSemanticClarity: 0,
          avgConversationalUsefulness: 0,
          totalScore: 0,
          totalTrials,
          filteredTrials: 0,
        };
      }

      const successCount = trials.filter(
        (t) => t.outcome === "SUCCESS"
      ).length;
      const successRate = successCount / filteredTrials;

      const avg = (field: keyof typeof trials[0]) =>
        trials.reduce((sum, t) => sum + ((t[field] as number) ?? 0), 0) / filteredTrials;

      const avgAcousticNaturalness = avg("acousticNaturalness");
      const avgPerceivedNaturalness = avg("perceivedNaturalness");
      const avgSemanticClarity = avg("semanticClarity");
      const avgConversationalUsefulness = avg("conversationalUsefulness");

      // 4指標の平均を 1-5 → 0-1 に正規化
      const averageScore =
        ((avgAcousticNaturalness + avgPerceivedNaturalness + avgSemanticClarity + avgConversationalUsefulness) / 4 - 1) / 4;
      const totalScore = 0.5 * successRate + 0.5 * averageScore;

      return {
        modelId: model.id,
        modelName: model.name,
        successRate: Math.round(successRate * 1000) / 1000,
        avgAcousticNaturalness: Math.round(avgAcousticNaturalness * 100) / 100,
        avgPerceivedNaturalness: Math.round(avgPerceivedNaturalness * 100) / 100,
        avgSemanticClarity: Math.round(avgSemanticClarity * 100) / 100,
        avgConversationalUsefulness: Math.round(avgConversationalUsefulness * 100) / 100,
        totalScore: Math.round(totalScore * 1000) / 1000,
        totalTrials,
        filteredTrials,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  return NextResponse.json(leaderboard);
}
