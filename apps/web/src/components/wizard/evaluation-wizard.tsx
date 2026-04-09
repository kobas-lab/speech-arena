"use client";

import { useReducer, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { wizardReducer, loadSavedState, saveState, clearSavedState } from "./wizard-reducer";
import { WelcomeStep } from "./steps/welcome-step";
import { TrialStep } from "./steps/trial-step";
import { VoteStep } from "./steps/vote-step";
import { CompleteStep } from "./steps/complete-step";
import { GpuWaitingStep } from "./steps/gpu-waiting-step";
import * as api from "@/src/lib/api";
import { waitForGpuReady } from "@/src/lib/gpu-session";

export function EvaluationWizard() {
  const [state, dispatch] = useReducer(wizardReducer, undefined, loadSavedState);

  // state が変わるたびに localStorage に保存
  useEffect(() => {
    if (state.step === "complete") {
      clearSavedState();
    } else {
      saveState(state);
    }
  }, [state]);
  const [gpuWaiting, setGpuWaiting] = useState(false);
  const [gpuProgress, setGpuProgress] = useState("");

  const handleStart = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await api.createMatchup();

      // GPU セッションがある場合はポーリングで待つ
      const hasGpu = data.arms.some((arm) => arm.gpuSessionId);
      if (hasGpu) {
        setGpuWaiting(true);
        setGpuProgress("GPU を起動中...");

        // 両方の GPU セッションが running になるのを待つ
        const gpuArms = await Promise.all(
          data.arms.map(async (arm) => {
            if (!arm.gpuSessionId) return arm;
            try {
              const session = await waitForGpuReady(
                arm.gpuSessionId,
                (msg) => setGpuProgress(msg),
              );
              return {
                ...arm,
                endpointUrl: `http://${session.publicIp}:${session.port || 8998}`,
              };
            } catch {
              return arm; // フォールバック: 元の endpointUrl を使う
            }
          })
        );

        setGpuWaiting(false);
        dispatch({
          type: "MATCHUP_CREATED",
          payload: {
            matchupId: data.matchupId,
            workerId: data.workerId,
            arms: gpuArms,
          },
        });
      } else {
        dispatch({
          type: "MATCHUP_CREATED",
          payload: {
            matchupId: data.matchupId,
            workerId: data.workerId,
            arms: data.arms,
          },
        });
      }
    } catch (e) {
      setGpuWaiting(false);
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
      // GPU モードの場合は arm.endpointUrl（動的 IP）を使う
      const endpointUrl = arm.endpointUrl || data.endpointUrl;
      dispatch({
        type: "TRIAL_STARTED",
        payload: { trialId: data.trialId, endpointUrl },
      });
      window.open(endpointUrl, "_blank");
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
    acousticNaturalness: number;
    perceivedNaturalness: number;
    semanticClarity: number;
    conversationalUsefulness: number;
    hasPacketLoss: boolean;
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
      {gpuWaiting && (
        <GpuWaitingStep progress={gpuProgress} />
      )}
      {!gpuWaiting && state.step === "welcome" && (
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
