import type { PingSummary } from "@/shared/shareTypes";

type Output = {
  dc: string;
  dc_id: number;
  region: string;
};

const PING_TIMEOUT_MS = 2000;

const createTimeoutSignal = (
  signal?: AbortSignal,
  timeoutMs = PING_TIMEOUT_MS,
): AbortSignal => {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!signal) return timeoutSignal;

  if ("any" in AbortSignal) {
    return AbortSignal.any([signal, timeoutSignal]);
  }

  const controller = new AbortController();
  const abort = () => controller.abort();

  if (signal.aborted) {
    controller.abort();
  } else {
    signal.addEventListener("abort", abort);
  }

  timeoutSignal.addEventListener("abort", abort);

  return controller.signal;
};

export type PingResult = {
  dc: string;
  dc_id: number;
  region: string;
  latency: number;
  serverIp: string;
  clientIp: string;
};

export const testPingHead = async (
  target: string,
  signal?: AbortSignal,
): Promise<number> => {
  const timeoutSignal = createTimeoutSignal(signal);
  const start = performance.now();
  const response = await fetch(`${target}?s=${start}`, {
    keepalive: true,
    cache: "no-store",
    method: "HEAD",
    signal: timeoutSignal,
  });
  const latency = performance.now() - start;

  if (!response.ok) {
    throw new Error(`Ping failed: ${response.statusText}`);
  }
  return latency;
};

export const testPing = async (
  target: string,
  signal?: AbortSignal,
): Promise<PingResult> => {
  const timeoutSignal = createTimeoutSignal(signal);
  const start = performance.now();
  let response;
  try {
    response = await fetch(`${target}?s=${start}`, {
      keepalive: true,
      cache: "no-store",
      signal: timeoutSignal,
    });
  } catch (error: unknown) {
    console.log("Got error running ping test to", target, error);
    throw error;
  }

  const latency = performance.now() - start;

  if (!response.ok) {
    throw new Error(`Ping failed: ${response.statusText}`);
  }

  const clientIp = response.headers.get("X-Client-Ip") as string;
  const serverIp = response.headers.get("X-Server-Ip") as string;

  console.log("Ping response headers:", response.headers.get("X-Origin"));

  const data: Output = await response.json();
  return {
    dc: data.dc,
    dc_id: data.dc_id,
    region: data.region,
    latency,
    serverIp,
    clientIp,
  };
};

export type TestPingsOpts = {
  signal?: AbortSignal;
  onUpdate?: (arg: PingSummary) => void;
};

export const testPings = async (
  target: string,
  opts?: TestPingsOpts,
): Promise<PingSummary> => {
  const MAX_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const initPingTest = await testPing(target, opts?.signal);
      const latencies: number[] = [];
      const testTime = 1000;
      const testStart = Date.now();
      const maxPings = 100000;
      const minPings = 10;

      const current = {
        dc: initPingTest.dc,
        dc_id: initPingTest.dc_id,
        region: initPingTest.region,
        serverIp: initPingTest.serverIp,
        clientIp: initPingTest.clientIp,
        latencyMax: initPingTest.latency,
        latencyMin: initPingTest.latency,
        latencyAvg: initPingTest.latency,
        latencyJitter: 0,
        clientIpChanged: false,
      };

      for (let i = 0; i < maxPings; i++) {
        latencies.push(await testPingHead(target, opts?.signal));
        latencies.sort((a, b) => a - b);
        const use = latencies.slice(0, Math.max(20, latencies.length / 2));

        current.latencyMax = Math.max(...use);
        current.latencyMin = Math.min(...use);
        current.latencyAvg =
          use.reduce((sum, latency) => sum + latency, 0) / use.length;
        current.latencyJitter = Math.sqrt(
          use.reduce(
            (sum, latency) => sum + Math.pow(latency - current.latencyAvg, 2),
            0,
          ) / use.length,
        );

        opts?.onUpdate?.(current);

        const age = Date.now() - testStart;

        if (testTime < age && minPings <= latencies.length) {
          break;
        }

        if (testTime * 5 < age) {
          break;
        }
      }

      current.clientIpChanged =
        (await testPing(target)).clientIp != initPingTest.clientIp;
      return current;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (opts?.signal?.aborted) {
          throw error;
        }
      }

      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(
        `Ping attempt ${attempt + 1}/${MAX_RETRIES + 1} failed for ${target}:`,
        lastError.message,
      );

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  return {
    dc: "",
    dc_id: 0,
    region: "",
    serverIp: "",
    clientIp: "",
    latencyMax: 0,
    latencyMin: 0,
    latencyAvg: 0,
    latencyJitter: 0,
    clientIpChanged: false,
    error: lastError?.message || "Connection failed",
  };
};
