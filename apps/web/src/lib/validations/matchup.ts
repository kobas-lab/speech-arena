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
    })
  ),
});

export type CreateMatchupResponse = z.infer<typeof createMatchupResponseSchema>;
