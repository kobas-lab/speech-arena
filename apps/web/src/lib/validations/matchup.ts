import { z } from "zod";

export const createMatchupResponseSchema = z.object({
  matchupId: z.string(),
  workerId: z.string(),
  arms: z.array(
    z.object({
      armId: z.string(),
      slot: z.enum(["A", "B"]),
      endpointUrl: z.string(),
      trialsRequired: z.number(),
      gpuSessionId: z.string().optional(),
    })
  ),
});

export type CreateMatchupResponse = z.infer<typeof createMatchupResponseSchema>;

// POST /api/matchups/vote
export const matchupVoteRequestSchema = z.object({
  matchupId: z.string(),
  choice: z.enum(["A", "B", "DRAW"]),
  rationale: z.string().optional(),
});

export type MatchupVoteRequest = z.infer<typeof matchupVoteRequestSchema>;

export const matchupVoteResponseSchema = z.object({
  voteId: z.string(),
  choice: z.enum(["A", "B", "DRAW"]),
});

export type MatchupVoteResponse = z.infer<typeof matchupVoteResponseSchema>;
