import type {
  CreateShareRequest,
  PingResults,
  ShareSnapshot,
} from "../src/shared/shareTypes";

type AssetBinding = {
  fetch(request: Request): Promise<Response>;
};

type R2ObjectBody = {
  text(): Promise<string>;
};

type R2BucketBinding = {
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<void>;
};

type Env = {
  ASSETS: AssetBinding;
  SHARE_RESULTS_BUCKET: R2BucketBinding;
  SHARE_URL_BASE?: string;
};

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const shareIdPattern = /^[a-z0-9]{12}$/;

const createJsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  });

const createErrorResponse = (message: string, status = 400) =>
  createJsonResponse({ error: message }, status);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

const isOptionalIndex = (value: unknown): value is number | undefined =>
  value === undefined || (isInteger(value) && value >= 0);

const isOptionalLocation = (
  value: unknown,
): value is [number, number] | undefined =>
  value === undefined ||
  (Array.isArray(value) &&
    value.length === 2 &&
    isFiniteNumber(value[0]) &&
    isFiniteNumber(value[1]));

const isPingSummary = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const summary = value as Record<string, unknown>;
  return (
    typeof summary.dc === "string" &&
    isInteger(summary.dc_id) &&
    typeof summary.region === "string" &&
    typeof summary.serverIp === "string" &&
    (summary.clientIp === undefined || typeof summary.clientIp === "string") &&
    isFiniteNumber(summary.latencyMax) &&
    isFiniteNumber(summary.latencyMin) &&
    isFiniteNumber(summary.latencyAvg) &&
    isFiniteNumber(summary.latencyJitter) &&
    typeof summary.clientIpChanged === "boolean" &&
    (summary.error === undefined || typeof summary.error === "string")
  );
};

const normalizePingResults = (value: unknown): PingResults | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return null;
  }

  const pingResults: PingResults = {};
  for (const [key, summary] of entries) {
    if (!isPingSummary(summary)) {
      return null;
    }
    pingResults[key] = summary;
  }

  return pingResults;
};

const normalizeCreateShareRequest = (
  value: unknown,
): CreateShareRequest | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Record<string, unknown>;
  const pingResults = normalizePingResults(payload.pingResults);
  if (!pingResults) {
    return null;
  }

  if (!isOptionalIndex(payload.bestTargetIndex)) {
    return null;
  }

  if (!isOptionalIndex(payload.selectedTargetIndex)) {
    return null;
  }

  if (!isOptionalLocation(payload.userLocation)) {
    return null;
  }

  const clientIp =
    typeof payload.clientIp === "string" ? payload.clientIp : undefined;

  return {
    clientIp,
    pingResults,
    bestTargetIndex: payload.bestTargetIndex,
    selectedTargetIndex: payload.selectedTargetIndex,
    userLocation: payload.userLocation,
  };
};

const normalizeStoredSnapshot = (value: unknown): ShareSnapshot | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const snapshot = value as Record<string, unknown>;
  const pingResults = normalizePingResults(snapshot.pingResults);
  if (!pingResults) {
    return null;
  }

  if (
    !isInteger(snapshot.version) ||
    typeof snapshot.createdAt !== "string" ||
    !isOptionalIndex(snapshot.bestTargetIndex) ||
    !isOptionalIndex(snapshot.selectedTargetIndex) ||
    !isOptionalLocation(snapshot.userLocation)
  ) {
    return null;
  }

  const clientIp =
    typeof snapshot.clientIp === "string" ? snapshot.clientIp : undefined;

  return {
    version: snapshot.version,
    createdAt: snapshot.createdAt,
    clientIp,
    pingResults,
    bestTargetIndex: snapshot.bestTargetIndex,
    selectedTargetIndex: snapshot.selectedTargetIndex,
    userLocation: snapshot.userLocation,
  };
};

const createShareId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (value) => value.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 12);
};

const getShareUrl = (request: Request, env: Env, shareId: string) => {
  const base = env.SHARE_URL_BASE?.trim();
  const url = new URL(base && base.length > 0 ? base : request.url);
  url.pathname = `/shared/${shareId}`;
  url.search = "";
  return url.toString();
};

const handleCreateShare = async (request: Request, env: Env) => {
  let data: unknown;

  try {
    data = await request.json();
  } catch {
    return createErrorResponse("Invalid JSON body.", 400);
  }

  const payload = normalizeCreateShareRequest(data);
  if (!payload) {
    return createErrorResponse("Invalid share payload.", 400);
  }

  let clientIp = payload.clientIp;
  const strippedResults: PingResults = {};
  for (const [key, summary] of Object.entries(payload.pingResults)) {
    if (!clientIp && summary.clientIp) {
      clientIp = summary.clientIp;
    }
    const { clientIp: _stripped, ...rest } = summary;
    strippedResults[key] = rest;
  }

  const shareId = createShareId();
  const snapshot: ShareSnapshot = {
    version: 1,
    createdAt: new Date().toISOString(),
    clientIp,
    pingResults: strippedResults,
    bestTargetIndex: payload.bestTargetIndex,
    selectedTargetIndex: payload.selectedTargetIndex,
    userLocation: payload.userLocation,
  };

  await env.SHARE_RESULTS_BUCKET.put(
    `shares/${shareId}.json`,
    JSON.stringify(snapshot),
    {
      httpMetadata: {
        contentType: "application/json",
      },
    },
  );

  return createJsonResponse({
    shareId,
    shareUrl: getShareUrl(request, env, shareId),
  });
};

const handleGetShare = async (shareId: string, env: Env) => {
  if (!shareIdPattern.test(shareId)) {
    return createErrorResponse("Invalid share id.", 400);
  }

  const object = await env.SHARE_RESULTS_BUCKET.get(`shares/${shareId}.json`);
  if (!object) {
    return createErrorResponse("Shared result not found.", 404);
  }

  const parsed = normalizeStoredSnapshot(JSON.parse(await object.text()));
  if (!parsed) {
    return createErrorResponse("Stored share payload is invalid.", 500);
  }

  const { clientIp: _ip, userLocation: _loc, ...publicSnapshot } = parsed;
  return createJsonResponse(publicSnapshot);
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: jsonHeaders,
      });
    }

    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/share") {
      return handleCreateShare(request, env);
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/share/")) {
      const shareId = url.pathname.slice("/api/share/".length);
      return handleGetShare(shareId, env);
    }

    return env.ASSETS.fetch(request);
  },
};
