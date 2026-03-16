import type { ShareState } from "@/shared/shareState";

type Props = {
  onShare?: () => void;
  shareState: ShareState;
  isSharedView?: boolean;
  sharedCreatedAt?: string;
};

const getShareButtonLabel = (shareState: ShareState) => {
  if (shareState.status === "saving") {
    return "[...] BUILDING LINK";
  }

  if (shareState.status === "ready") {
    return shareState.copied ? "[OK] COPIED LINK" : "[#] COPY LINK";
  }

  return "[#] SHARE RESULTS";
};

export default function ShareResultPanel({
  onShare,
  shareState,
  isSharedView,
  sharedCreatedAt,
}: Props) {
  return (
    <div
      className="border-2 p-4"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-primary)",
      }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-pixel text-[10px] uppercase tracking-widest text-orange-300">
            {isSharedView ? "Shared snapshot" : "Save this run"}
          </div>
          <p className="mt-2 mb-0 text-sm font-mono text-zinc-400 leading-relaxed">
            {isSharedView
              ? "This view was loaded from a saved link. Copy it again or re-run the test for a fresh measurement."
              : "Create a permanent link for this latency run so you can send the exact results to someone else."}
          </p>
          {sharedCreatedAt && (
            <div className="mt-3 text-xs font-mono text-cyan-300">
              Captured at {new Date(sharedCreatedAt).toLocaleString()}
            </div>
          )}
        </div>
        {shareState.status !== "ready" && (
          <button
            onClick={onShare}
            disabled={
              shareState.status === "saving" || shareState.status === "loading"
            }
            className="px-4 py-3 border-2 border-cyan-500 bg-cyan-700 hover:bg-cyan-600 disabled:cursor-wait disabled:opacity-60 text-white font-pixel text-[10px] uppercase tracking-wide cursor-pointer"
          >
            {getShareButtonLabel(shareState)}
          </button>
        )}
      </div>
      {shareState.status === "ready" && (
        <div
          className="mt-4 border border-cyan-800 px-3 py-2"
          style={{ backgroundColor: "rgba(8, 47, 73, 0.45)" }}
        >
          <div className="font-pixel text-[8px] uppercase tracking-widest text-cyan-300">
            {shareState.source === "loaded"
              ? "Loaded from share link"
              : "Share link ready"}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="break-all text-sm font-mono text-cyan-100 flex-1">
              {shareState.url}
            </div>
            <button
              onClick={onShare}
              className="shrink-0 px-4 py-2 border-2 border-cyan-500 bg-cyan-700 hover:bg-cyan-600 text-white font-pixel text-[10px] uppercase tracking-wide cursor-pointer"
            >
              {shareState.copied ? "[OK] COPIED" : "[#] COPY LINK"}
            </button>
          </div>
        </div>
      )}
      {shareState.status === "error" && (
        <div
          className="mt-4 border border-red-700 px-3 py-2 text-sm font-mono text-red-300"
          style={{ backgroundColor: "rgba(69, 10, 10, 0.45)" }}
        >
          {shareState.message}
        </div>
      )}
    </div>
  );
}
