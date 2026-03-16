import type {
  CreateShareRequest,
  CreateShareResponse,
  ShareSnapshot,
} from "@/shared/shareTypes";

const buildApiUrl = (path: string) =>
  new URL(path, window.location.origin).toString();

const getErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { error?: string };
    if (typeof data.error === "string" && data.error.length > 0) {
      return data.error;
    }
  } catch {
    // Ignore invalid JSON and fall back to the HTTP status text.
  }

  return `Request failed: ${response.status} ${response.statusText}`.trim();
};

export async function createShare(
  payload: CreateShareRequest,
  signal?: AbortSignal,
): Promise<CreateShareResponse> {
  const response = await fetch(buildApiUrl("/api/share"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as CreateShareResponse;
}

export async function getSharedSnapshot(
  shareId: string,
  signal?: AbortSignal,
): Promise<ShareSnapshot> {
  const response = await fetch(
    buildApiUrl(`/api/share/${encodeURIComponent(shareId)}`),
    { signal },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as ShareSnapshot;
}

export function buildSharePath(shareId: string): string {
  return `/shared/${encodeURIComponent(shareId)}`;
}

export function buildShareLocation(shareId: string): URL {
  return new URL(buildSharePath(shareId), window.location.origin);
}
