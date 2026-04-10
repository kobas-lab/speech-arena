"use client";

import { useReducer, useState, useEffect } from "react";
import { toast } from "sonner";
import { wizardReducer, initialState, loadSavedState, saveState, clearSavedState } from "./wizard-reducer";
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
  const [state, dispatch] = useReducer(wizardReducer, undefined, () => initialState);
  const [mounted, setMounted] = useState(false);
  const [gpuProgress, setGpuProgress] = useState("");

  // クライアントマウント時に localStorage から復元
  useEffect(() => {
    const saved = loadSavedState();
    if (saved.step !== "welcome") {
      dispatch({ type: "RESTORE_STATE", payload: saved });
    }
    setMounted(true);
  }, []);

  // state が変わるたびに localStorage に保存（マウント後のみ）
  useEffect(() => {
    if (!mounted) return;
    if (state.step === "complete") {
      clearSavedState();
      clearGpuSessions();
    } else if (state.step !== "welcome") {
      saveState(state);
    }
  }, [state, mounted]);

  // gpu-waiting ステップの場合、GPU ポーリングを実行
  useEffect(() => {
    if (!mounted || state.step !== "gpu-waiting") return;

    const savedSessions = loadGpuSessions();
    if (savedSessions.length === 0) return;

    async function pollGpu() {
      setGpuProgress("GPU の状態を確認中...");

      const updatedArms = [...state.arms];

      const results = await Promise.all(
        savedSessions.map(async (session) => {
          try {
            const status = await getGpuSession(session.sessionId);
            if (status.status === "running" && (status.endpointUrl || status.publicIp)) {
              return {
                armIndex: session.armIndex,
                endpointUrl: status.endpointUrl || `http://${status.publicIp}:${status.port || session.port}`,
              };
            }
            if (status.status === "failed") {
              throw new Error("GPU セッションの起動に失敗しました");
            }
            const ready = await waitForGpuReady(
              session.sessionId,
              (msg) => setGpuProgress(msg),
            );
            return {
              armIndex: session.armIndex,
              endpointUrl: ready.endpointUrl || `http://${ready.publicIp}:${ready.port || session.port}`,
            };
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "GPU の起動に失敗しました。ページをリロードして再度お試しください。");
            return null;
          }
        })
      );

      for (const result of results) {
        if (result && updatedArms[result.armIndex]) {
          updatedArms[result.armIndex] = {
            ...updatedArms[result.armIndex],
            endpointUrl: result.endpointUrl,
          };
        }
      }

      // 全セッション失敗なら welcome に戻す
      const anySuccess = results.some((r) => r !== null);
      if (!anySuccess) {
        clearSavedState();
        clearGpuSessions();
        dispatch({ type: "RESTORE_STATE", payload: { ...initialState } });
        return;
      }

      // GPU 準備完了 → trial ステップへ
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
    }

    pollGpu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, state.step]);

  const handleStart = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await api.createMatchup();

      const hasGpu = data.arms.some((arm) => arm.gpuSessionId);
      if (hasGpu) {
        // GPU セッション ID を localStorage に保存
        const gpuSessions: GpuSessionInfo[] = data.arms
          .map((arm, i) => arm.gpuSessionId ? { armIndex: i, sessionId: arm.gpuSessionId, port: 8998 + i } : null)
          .filter((s): s is GpuSessionInfo => s !== null);
        saveGpuSessions(gpuSessions);

        // gpu-waiting ステップへ（useEffect でポーリング開始）
        dispatch({
          type: "GPU_WAITING",
          payload: {
            matchupId: data.matchupId,
            workerId: data.workerId,
            arms: data.arms,
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
      if (endpointUrl.includes("placeholder")) {
        throw new Error("GPU が準備できていません。ページをリロードしてください。");
      }
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

  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center p-4" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {state.step === "welcome" && (
        <WelcomeStep onStart={handleStart} isLoading={state.isLoading} />
      )}
      {state.step === "gpu-waiting" && (
        <GpuWaitingStep progress={gpuProgress} />
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
