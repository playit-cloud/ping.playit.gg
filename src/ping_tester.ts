type Output = {
  dc: string;
  dc_id: number;
  region: string;
};

export type PingResult = {
  dc: string;
  dc_id: number;
  region: string;
  latency: number;
  serverIp: string;
  clientIp: string;
};

export type PingSummary = {
  dc: string;
  dc_id: number;
  region: string;
  serverIp: string;
  clientIp: string;
  latencyMax: number;
  latencyMin: number;
  latencyAvg: number;
  latencyJitter: number;
  clientIpChanged: boolean;
};

export const testPingHead = async (
  target: string,
  signal?: AbortSignal,
): Promise<number> => {
  const start = performance.now();
  const response = await fetch(`${target}?s=${start}`, {
    keepalive: true,
    cache: "no-store",
    method: "HEAD",
    signal,
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
  const start = performance.now();
  let response;
  try {
    response = await fetch(`${target}?s=${start}`, {
      keepalive: true,
      cache: "no-store",
      signal,
    });
  } catch (e: unknown) {
    console.log("Got error running ping test to", target, e);
    throw e;
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

    /* update current */
    {
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
    }

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
};
