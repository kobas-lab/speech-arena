import type { WizardState, WizardAction } from "@/src/lib/types";

const STORAGE_KEY = "speech-arena-wizard-state";

export const initialState: WizardState = {
  step: "welcome",
  matchupId: null,
  workerId: null,
  arms: [],
  currentArmIndex: 0,
  currentTrialIndex: 1,
  trialPhase: "ready",
  currentTrialId: null,
  currentEndpointUrl: null,
  completedTrials: [],
  isLoading: false,
  error: null,
};

export function loadSavedState(): WizardState {
  if (typeof window === "undefined") return initialState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialState;
    const parsed = JSON.parse(saved) as WizardState;
    // complete ステップは復元しない（新規評価を促す）
    if (parsed.step === "complete" || parsed.step === "welcome") {
      return initialState;
    }
    // isLoading はリセット
    return { ...parsed, isLoading: false, error: null };
  } catch {
    return initialState;
  }
}

export function saveState(state: WizardState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage が使えない環境では無視
  }
}

export function clearSavedState() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload, error: null };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "MATCHUP_CREATED":
      return {
        ...state,
        step: "trial",
        matchupId: action.payload.matchupId,
        workerId: action.payload.workerId,
        arms: action.payload.arms,
        currentArmIndex: 0,
        currentTrialIndex: 1,
        trialPhase: "ready",
        isLoading: false,
      };

    case "TRIAL_STARTED":
      return {
        ...state,
        trialPhase: "in-session",
        currentTrialId: action.payload.trialId,
        currentEndpointUrl: action.payload.endpointUrl,
        isLoading: false,
      };

    case "SESSION_DONE":
      return {
        ...state,
        trialPhase: "rating",
      };

    case "TRIAL_COMPLETED": {
      const arm = state.arms[state.currentArmIndex];
      const isLastTrialOfArm = state.currentTrialIndex >= arm.trialsRequired;
      const isLastArm = state.currentArmIndex >= state.arms.length - 1;

      if (isLastTrialOfArm && isLastArm) {
        return {
          ...state,
          completedTrials: [...state.completedTrials, action.payload],
          step: "vote",
          trialPhase: "ready",
          currentTrialId: null,
          currentEndpointUrl: null,
          isLoading: false,
        };
      }

      if (isLastTrialOfArm) {
        return {
          ...state,
          completedTrials: [...state.completedTrials, action.payload],
          currentArmIndex: state.currentArmIndex + 1,
          currentTrialIndex: 1,
          trialPhase: "ready",
          currentTrialId: null,
          currentEndpointUrl: null,
          isLoading: false,
        };
      }

      return {
        ...state,
        completedTrials: [...state.completedTrials, action.payload],
        currentTrialIndex: state.currentTrialIndex + 1,
        trialPhase: "ready",
        currentTrialId: null,
        currentEndpointUrl: null,
        isLoading: false,
      };
    }

    case "VOTE_SUBMITTED":
      return {
        ...state,
        step: "complete",
        isLoading: false,
      };

    default:
      return state;
  }
}
