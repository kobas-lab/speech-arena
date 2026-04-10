const API_GATEWAY_ENDPOINT = process.env.NEXT_PUBLIC_GPU_API_ENDPOINT || "";

interface GpuSession {
  sessionId: string;
  status: "starting" | "running" | "failed";
  publicIp?: string;
  port?: number;
  endpointUrl?: string;
}

export async function startGpuSession(modelRepo: string, port: number = 8998): Promise<GpuSession> {
  if (!API_GATEWAY_ENDPOINT) {
    throw new Error("GPU API endpoint not configured");
  }

  const res = await fetch(`${API_GATEWAY_ENDPOINT}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelRepo, port }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to start GPU session: ${res.status}`);
  }

  return res.json();
}

export async function getGpuSession(sessionId: string): Promise<GpuSession> {
  if (!API_GATEWAY_ENDPOINT) {
    throw new Error("GPU API endpoint not configured");
  }

  const res = await fetch(`${API_GATEWAY_ENDPOINT}/sessions/${sessionId}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to get session: ${res.status}`);
  }

  return res.json();
}

export async function waitForGpuReady(
  sessionId: string,
  onProgress?: (status: string) => void,
  maxWaitMs: number = 1200000, // 20分
  intervalMs: number = 5000,  // 5秒ごと
): Promise<GpuSession> {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const session = await getGpuSession(sessionId);

    if (session.status === "running" && session.publicIp) {
      return session;
    }

    if (session.status === "failed") {
      throw new Error("GPU session failed to start");
    }

    onProgress?.(`モデルを準備中です... (${Math.floor((Date.now() - start) / 1000)}秒)`);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("GPU session timed out");
}
