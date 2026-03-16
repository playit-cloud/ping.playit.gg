import { useEffect, useState } from "react";
import { getSharedSnapshot } from "@/api/shareResults";
import type { ShareSnapshot } from "@/shared/shareTypes";

type SharedSnapshotState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; snapshot: ShareSnapshot }
  | { status: "error"; message: string };

export function useSharedSnapshot(shareId?: string) {
  const [state, setState] = useState<SharedSnapshotState>(
    shareId ? { status: "loading" } : { status: "idle" },
  );

  useEffect(() => {
    if (!shareId) {
      setState({ status: "error", message: "Missing share id." });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading" });

    (async () => {
      try {
        const snapshot = await getSharedSnapshot(shareId, controller.signal);
        setState({ status: "ready", snapshot });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to load shared result.",
        });
      }
    })();

    return () => controller.abort();
  }, [shareId]);

  return state;
}
