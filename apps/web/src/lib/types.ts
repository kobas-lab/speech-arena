export type { CreateMatchupResponse, MatchupVoteRequest, MatchupVoteResponse } from "./validations/matchup";
export type { StartTrialRequest, StartTrialResponse, CompleteTrialRequest, CompleteTrialResponse } from "./validations/trial";
export type { LeaderboardEntry, LeaderboardResponse } from "./validations/leaderboard";

export type WizardStep = "welcome" | "gpu-waiting" | "trial" | "vote" | "complete";
export type TrialPhase = "ready" | "in-session" | "rating";

export interface ArmData {
  armId: string;
  slot: "A" | "B";
  endpointUrl: string;
  trialsRequired: number;
  gpuSessionId?: string;
}

export interface CompletedTrial {
  trialId: string;
  armIndex: number;
  trialIndex: number;
  outcome: "SUCCESS" | "FAILURE";
  acousticNaturalness: number;
  perceivedNaturalness: number;
  semanticClarity: number;
  conversationalUsefulness: number;
  hasPacketLoss: boolean;
}

export interface WizardState {
  step: WizardStep;
  matchupId: string | null;
  workerId: string | null;
  arms: ArmData[];
  currentArmIndex: number; // 0=A, 1=B
  currentTrialIndex: number; // 1-based
  trialPhase: TrialPhase;
  currentTrialId: string | null;
  currentEndpointUrl: string | null;
  completedTrials: CompletedTrial[];
  isLoading: boolean;
  error: string | null;
}

export type WizardAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "GPU_WAITING"; payload: { matchupId: string; workerId: string; arms: ArmData[] } }
  | { type: "MATCHUP_CREATED"; payload: { matchupId: string; workerId: string; arms: ArmData[] } }
  | { type: "TRIAL_STARTED"; payload: { trialId: string; endpointUrl: string } }
  | { type: "SESSION_DONE" }
  | { type: "TRIAL_COMPLETED"; payload: CompletedTrial }
  | { type: "VOTE_SUBMITTED" }
  | { type: "RESTORE_STATE"; payload: WizardState };
