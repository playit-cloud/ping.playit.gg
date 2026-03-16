import MapChart, { type Mode } from "@/components/MapChart";
import pingTargets from "@/shared/pingTargets";
import type { TestState } from "@/shared/testState";

type Props = {
  mode: Mode;
  testState: TestState;
  loadingSharedSnapshot?: boolean;
  sharedSnapshotError?: string;
};

export default function MapPanel({
  mode,
  testState,
  loadingSharedSnapshot = false,
  sharedSnapshotError,
}: Props) {
  return (
    <div
      className="flex-1 min-h-[300px] lg:min-h-0 relative border-r-2"
      style={{ borderColor: "var(--border-primary)" }}
    >
      <MapChart mode={mode} />
      {loadingSharedSnapshot && (
        <div
          className="absolute top-3 left-3 border-2 border-cyan-500 px-3 py-2 text-xs text-cyan-300 font-pixel uppercase"
          style={{ backgroundColor: "var(--bg-primary)", opacity: 0.95 }}
        >
          Loading shared snapshot...
        </div>
      )}
      {sharedSnapshotError && (
        <div
          className="absolute top-3 left-3 right-3 border-2 border-red-500 px-3 py-2 text-xs text-red-300 font-pixel uppercase"
          style={{ backgroundColor: "rgba(69, 10, 10, 0.9)" }}
        >
          {sharedSnapshotError}
        </div>
      )}
      {testState.type === "running" && (
        <div
          className="absolute top-3 left-3 border-2 border-cyan-500 px-3 py-2 flex items-center gap-3"
          style={{ backgroundColor: "var(--bg-primary)", opacity: 0.95 }}
        >
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-cyan-400 animate-pulse"></span>
            <span
              className="w-2 h-2 bg-cyan-400 animate-pulse"
              style={{ animationDelay: "0.2s" }}
            ></span>
            <span
              className="w-2 h-2 bg-cyan-400 animate-pulse"
              style={{ animationDelay: "0.4s" }}
            ></span>
          </div>
          <span className="text-xs text-cyan-400 font-pixel uppercase">
            PINGING {pingTargets[testState.currentTargetIndex]?.name}...
          </span>
        </div>
      )}
    </div>
  );
}
