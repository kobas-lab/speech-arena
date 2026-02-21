export type { CreateMatchupResponse, MatchupVoteRequest, MatchupVoteResponse } from "./validations/matchup";
export type { StartTrialRequest, StartTrialResponse, CompleteTrialRequest, CompleteTrialResponse } from "./validations/trial";
export type { LeaderboardEntry, LeaderboardResponse } from "./validations/leaderboard";

export type WizardStep = "welcome" | "trial" | "vote" | "complete";
export type TrialPhase = "ready" | "in-session" | "rating";

export interface ArmData {
  armId: string;
  slot: "A" | "B";
  endpointUrl: string;
  trialsRequired: number;
}

export interface CompletedTrial {
  trialId: string;
  armIndex: number;
  trialIndex: number;
  outcome: "SUCCESS" | "FAILURE";
  naturalness: number;
  audioQuality: number;
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
  | { type: "MATCHUP_CREATED"; payload: { matchupId: string; workerId: string; arms: ArmData[] } }
  | { type: "TRIAL_STARTED"; payload: { trialId: string; endpointUrl: string } }
  | { type: "SESSION_DONE" }
  | { type: "TRIAL_COMPLETED"; payload: CompletedTrial }
  | { type: "VOTE_SUBMITTED" };
