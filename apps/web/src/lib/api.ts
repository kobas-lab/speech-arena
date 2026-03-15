import type {
  CreateMatchupResponse,
  StartTrialRequest,
  StartTrialResponse,
  CompleteTrialRequest,
  CompleteTrialResponse,
  MatchupVoteRequest,
  MatchupVoteResponse,
  LeaderboardResponse,
} from "./types";

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res.json();
}

export function createMatchup(): Promise<CreateMatchupResponse> {
  return fetchAPI("/api/matchups", { method: "POST" });
}

export function startTrial(data: StartTrialRequest): Promise<StartTrialResponse> {
  return fetchAPI("/api/trials/start", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function completeTrial(data: CompleteTrialRequest): Promise<CompleteTrialResponse> {
  return fetchAPI("/api/trials/complete", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function submitVote(data: MatchupVoteRequest): Promise<MatchupVoteResponse> {
  return fetchAPI("/api/matchups/vote", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getLeaderboard(params?: { from?: string; to?: string }): Promise<LeaderboardResponse> {
  const searchParams = new URLSearchParams();
  if (params?.from) searchParams.set("from", params.from);
  if (params?.to) searchParams.set("to", params.to);
  const query = searchParams.toString();
  return fetchAPI(`/api/leaderboard${query ? `?${query}` : ""}`);
}
