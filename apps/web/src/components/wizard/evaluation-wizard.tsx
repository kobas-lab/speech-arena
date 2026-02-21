"use client";

import { useReducer } from "react";
import { toast } from "sonner";
import { wizardReducer, initialState } from "./wizard-reducer";
import { WelcomeStep } from "./steps/welcome-step";
import { TrialStep } from "./steps/trial-step";
import { VoteStep } from "./steps/vote-step";
import { CompleteStep } from "./steps/complete-step";
import * as api from "@/src/lib/api";

export function EvaluationWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const handleStart = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await api.createMatchup();
      dispatch({
        type: "MATCHUP_CREATED",
        payload: {
          matchupId: data.matchupId,
          workerId: data.workerId,
          arms: data.arms,
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create matchup";
      dispatch({ type: "SET_ERROR", payload: msg });
      toast.error(msg);
    }
  };

  const handleStartTrial = async () => {
    if (!state.matchupId) return;
    const arm = state.arms[state.currentArmIndex];
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await api.startTrial({
        matchupId: state.matchupId,
        armId: arm.armId,
        trialIndex: state.currentTrialIndex,
      });
      dispatch({
        type: "TRIAL_STARTED",
        payload: { trialId: data.trialId, endpointUrl: data.endpointUrl },
      });
      window.open(data.endpointUrl, "_blank");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start trial";
      dispatch({ type: "SET_ERROR", payload: msg });
      toast.error(msg);
    }
  };

  const handleSessionDone = () => {
    dispatch({ type: "SESSION_DONE" });
  };

  const handleCompleteTrial = async (data: {
    outcome: "SUCCESS" | "FAILURE";
    naturalness: number;
    audioQuality: number;
  }) => {
    if (!state.currentTrialId) return;
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await api.completeTrial({
        trialId: state.currentTrialId,
        ...data,
      });
      dispatch({
        type: "TRIAL_COMPLETED",
        payload: {
          trialId: state.currentTrialId,
          armIndex: state.currentArmIndex,
          trialIndex: state.currentTrialIndex,
          ...data,
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to complete trial";
      dispatch({ type: "SET_ERROR", payload: msg });
      toast.error(msg);
    }
  };

  const handleVote = async (choice: "A" | "B" | "DRAW", rationale?: string) => {
    if (!state.matchupId) return;
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await api.submitVote({
        matchupId: state.matchupId,
        choice,
        rationale,
      });
      dispatch({ type: "VOTE_SUBMITTED" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to submit vote";
      dispatch({ type: "SET_ERROR", payload: msg });
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {state.step === "welcome" && (
        <WelcomeStep onStart={handleStart} isLoading={state.isLoading} />
      )}
      {state.step === "trial" && (
        <TrialStep
          arm={state.arms[state.currentArmIndex]}
          currentArmIndex={state.currentArmIndex}
          totalArms={state.arms.length}
          currentTrialIndex={state.currentTrialIndex}
          trialPhase={state.trialPhase}
          endpointUrl={state.currentEndpointUrl}
          isLoading={state.isLoading}
          onStartTrial={handleStartTrial}
          onSessionDone={handleSessionDone}
          onCompleteTrial={handleCompleteTrial}
        />
      )}
      {state.step === "vote" && (
        <VoteStep onVote={handleVote} isLoading={state.isLoading} />
      )}
      {state.step === "complete" && <CompleteStep />}
    </div>
  );
}
