import { z } from "zod";

export const leaderboardEntrySchema = z.object({
  modelId: z.string(),
  modelName: z.string(),
  successRate: z.number(),
  avgNaturalness: z.number(),
  avgAudioQuality: z.number(),
  totalScore: z.number(),
  totalTrials: z.number(),
});

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

export const leaderboardResponseSchema = z.array(leaderboardEntrySchema);

export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>;
