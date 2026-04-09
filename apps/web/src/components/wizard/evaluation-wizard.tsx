"use client";

import { useReducer, useState, useEffect } from "react";
import { toast } from "sonner";
import { wizardReducer, loadSavedState, saveState, clearSavedState } from "./wizard-reducer";
import { WelcomeStep } from "./steps/welcome-step";
import { TrialStep } from "./steps/trial-step";
import { VoteStep } from "./steps/vote-step";
import { CompleteStep } from "./steps/complete-step";
import { GpuWaitingStep } from "./steps/gpu-waiting-step";
import * as api from "@/src/lib/api";
import { waitForGpuReady, getGpuSession } from "@/src/lib/gpu-session";

const GPU_SESSIONS_KEY = "speech-arena-gpu-sessions";

interface GpuSessionInfo {
  armIndex: number;
  sessionId: string;
  port: number;
}

function saveGpuSessions(sessions: GpuSessionInfo[]) {
  try { localStorage.setItem(GPU_SESSIONS_KEY, JSON.stringify(sessions)); } catch {}
}

function loadGpuSessions(): GpuSessionInfo[] {
  try {
    const saved = localStorage.getItem(GPU_SESSIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function clearGpuSessions() {
  try { localStorage.removeItem(GPU_SESSIONS_KEY); } catch {}
}

export function EvaluationWizard() {
  const [state, dispatch] = useReducer(wizardReducer, undefined, loadSavedState);
  const [gpuWaiting, setGpuWaiting] = useState(false);
  const [gpuProgress, setGpuProgress] = useState("");

  // state が変わるたびに localStorage に保存
  useEffect(() => {
    if (state.step === "complete") {
      clearSavedState();
      clearGpuSessions();
    } else {
      saveState(state);
    }
  }, [state]);

  // リロード時: 保存された GPU セッションがあればポーリングを再開
  useEffect(() => {
    const savedSessions = loadGpuSessions();
    if (savedSessions.length === 0 || state.step === "welcome" || state.step === "complete") return;

    // GPU セッションが running か確認
    async function checkGpuSessions() {
      setGpuWaiting(true);
      setGpuProgress("GPU の状態を確認中...");

      const updatedArms = [...state.arms];
      let needsWait = false;

      for (const session of savedSessions) {
        try {
          const status = await getGpuSession(session.sessionId);
          if (status.status === "running" && status.publicIp) {
            // 既に running → endpointUrl を更新
            if (updatedArms[session.armIndex]) {
              updatedArms[session.armIndex] = {
                ...updatedArms[session.armIndex],
                endpointUrl: `http://${status.publicIp}:${status.port || session.port}`,
              };
            }
          } else if (status.status === "starting") {
            needsWait = true;
          }
        } catch {
          // セッションが見つからない場合はスキップ
        }
      }

      if (needsWait) {
        // まだ starting のセッションがあればポーリング
        const resolvedArms = await Promise.all(
          savedSessions.map(async (session) => {
            try {
              const ready = await waitForGpuReady(
                session.sessionId,
                (msg) => setGpuProgress(msg),
              );
              return {
                armIndex: session.armIndex,
                endpointUrl: `http://${ready.publicIp}:${ready.port || session.port}`,
              };
            } catch {
              return null;
            }
          })
        );

        for (const result of resolvedArms) {
          if (result && updatedArms[result.armIndex]) {
            updatedArms[result.armIndex] = {
              ...updatedArms[result.armIndex],
              endpointUrl: result.endpointUrl,
            };
          }
        }
      }

      // arms を更新して state に反映
      if (state.matchupId && state.workerId) {
        dispatch({
          type: "MATCHUP_CREATED",
          payload: {
            matchupId: state.matchupId,
            workerId: state.workerId,
            arms: updatedArms,
          },
        });
      }

      setGpuWaiting(false);
    }

    checkGpuSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // マウント時のみ実行

  const handleStart = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await api.createMatchup();

      // GPU セッションがある場合はポーリングで待つ
      const hasGpu = data.arms.some((arm) => arm.gpuSessionId);
      if (hasGpu) {
        // GPU セッション ID を localStorage に保存
        const gpuSessions: GpuSessionInfo[] = data.arms
          .map((arm, i) => arm.gpuSessionId ? { armIndex: i, sessionId: arm.gpuSessionId, port: 8998 + i } : null)
          .filter((s): s is GpuSessionInfo => s !== null);
        saveGpuSessions(gpuSessions);

        setGpuWaiting(true);
        setGpuProgress("GPU を起動中...");

        // 両方の GPU セッションが running になるのを待つ
        const gpuArms = await Promise.all(
          data.arms.map(async (arm, i) => {
            if (!arm.gpuSessionId) return arm;
            try {
              const session = await waitForGpuReady(
                arm.gpuSessionId,
                (msg) => setGpuProgress(msg),
              );
              return {
                ...arm,
                endpointUrl: `http://${session.publicIp}:${session.port || 8998 + i}`,
              };
            } catch {
              return arm;
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
      {!gpuWaiting && state.step === "trial" && (
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
      {!gpuWaiting && state.step === "vote" && (
        <VoteStep onVote={handleVote} isLoading={state.isLoading} />
      )}
      {!gpuWaiting && state.step === "complete" && <CompleteStep />}
    </div>
  );
}
