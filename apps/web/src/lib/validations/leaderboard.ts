import { z } from "zod";

export const leaderboardEntrySchema = z.object({
  modelId: z.string(),
  modelName: z.string(),
  successRate: z.number(),
  avgAcousticNaturalness: z.number(),
  avgPerceivedNaturalness: z.number(),
  avgSemanticClarity: z.number(),
  avgConversationalUsefulness: z.number(),
  totalScore: z.number(),
  totalTrials: z.number(),
  filteredTrials: z.number(),
});

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

export const leaderboardResponseSchema = z.array(leaderboardEntrySchema);

export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>;
