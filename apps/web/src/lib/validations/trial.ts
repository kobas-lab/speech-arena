import { z } from "zod";

// POST /api/trials/start
export const startTrialRequestSchema = z.object({
  matchupId: z.string(),
  armId: z.string(),
  trialIndex: z.number().int().min(1),
});

export type StartTrialRequest = z.infer<typeof startTrialRequestSchema>;

export const startTrialResponseSchema = z.object({
  trialId: z.string(),
  endpointUrl: z.string(),
});

export type StartTrialResponse = z.infer<typeof startTrialResponseSchema>;

// POST /api/trials/complete
export const completeTrialRequestSchema = z.object({
  trialId: z.string(),
  outcome: z.enum(["SUCCESS", "FAILURE"]),
  naturalness: z.number().int().min(1).max(5),
  audioQuality: z.number().int().min(1).max(5),
});

export type CompleteTrialRequest = z.infer<typeof completeTrialRequestSchema>;

export const completeTrialResponseSchema = z.object({
  trialId: z.string(),
  outcome: z.enum(["SUCCESS", "FAILURE"]),
  naturalness: z.number(),
  audioQuality: z.number(),
});

export type CompleteTrialResponse = z.infer<typeof completeTrialResponseSchema>;
