import { useCallback, useState } from "react";
import { buildShareLocation, createShare } from "@/api/shareResults";
import type { ShareState } from "@/shared/shareState";
import type { CreateShareRequest } from "@/shared/shareTypes";

type UseShareLinkStateOptions = {
  getPayload: () => CreateShareRequest | null;
};

const copyShareUrl = async (url: string) => {
  if (!navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
};

export function useShareLinkState({ getPayload }: UseShareLinkStateOptions) {
  const [shareState, setShareState] = useState<ShareState>({ status: "idle" });

  const markLoadedShare = useCallback((shareId: string) => {
    setShareState({
      status: "ready",
      url: buildShareLocation(shareId).toString(),
      source: "loaded",
      copied: false,
    });
  }, []);

  const setShareError = useCallback((message: string) => {
    setShareState({ status: "error", message });
  }, []);

  const resetShareState = useCallback(() => {
    setShareState({ status: "idle" });
  }, []);

  const handleShare = useCallback(async () => {
    if (shareState.status === "ready") {
      const copied = await copyShareUrl(shareState.url);
      setShareState({
        ...shareState,
        copied,
      });
      return;
    }

    const payload = getPayload();
    if (!payload) {
      return;
    }

    setShareState({ status: "saving" });

    try {
      const response = await createShare(payload);
      const copied = await copyShareUrl(response.shareUrl);
      setShareState({
        status: "ready",
        url: response.shareUrl,
        source: "created",
        copied,
      });
    } catch (error) {
      setShareState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to create share link.",
      });
    }
  }, [getPayload, shareState]);

  return {
    shareState,
    handleShare,
    markLoadedShare,
    setShareError,
    resetShareState,
  };
}
