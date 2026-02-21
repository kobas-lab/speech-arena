import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import type { LeaderboardResponse } from "@/src/lib/validations/leaderboard";

export async function GET() {
  const models = await prisma.model.findMany({
    where: { isActive: true },
    include: {
      arms: {
        include: {
          trials: {
            where: { outcome: { not: null } },
          },
        },
      },
    },
  });

  const leaderboard: LeaderboardResponse = models
    .map((model) => {
      const trials = model.arms.flatMap((arm) => arm.trials);
      const totalTrials = trials.length;

      if (totalTrials === 0) {
        return {
          modelId: model.id,
          modelName: model.name,
          successRate: 0,
          avgNaturalness: 0,
          avgAudioQuality: 0,
          totalScore: 0,
          totalTrials: 0,
        };
      }

      const successCount = trials.filter(
        (t) => t.outcome === "SUCCESS"
      ).length;
      const successRate = successCount / totalTrials;

      const avgNaturalness =
        trials.reduce((sum, t) => sum + (t.naturalness ?? 0), 0) / totalTrials;
      const avgAudioQuality =
        trials.reduce((sum, t) => sum + (t.audioQuality ?? 0), 0) / totalTrials;

      // averageScore: mean of naturalness and audioQuality normalized from 1-5 to 0-1
      const averageScore = ((avgNaturalness + avgAudioQuality) / 2 - 1) / 4;
      const totalScore = 0.5 * successRate + 0.5 * averageScore;

      return {
        modelId: model.id,
        modelName: model.name,
        successRate: Math.round(successRate * 1000) / 1000,
        avgNaturalness: Math.round(avgNaturalness * 100) / 100,
        avgAudioQuality: Math.round(avgAudioQuality * 100) / 100,
        totalScore: Math.round(totalScore * 1000) / 1000,
        totalTrials,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  return NextResponse.json(leaderboard);
}
