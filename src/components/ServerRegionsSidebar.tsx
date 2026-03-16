import datacenters from "@/shared/pingDcs";
import pingTargets from "@/shared/pingTargets";
import { formatRegion } from "@/shared/formatRegion";
import type { PingResults } from "@/shared/shareTypes";
import type { TestState } from "@/shared/testState";

type Props = {
  pingResults: PingResults;
  testState: TestState;
  isViewingSharedResult?: boolean;
  sharedUrl?: string;
  onSelectTarget: (index: number) => void;
};

export default function ServerRegionsSidebar({
  pingResults,
  testState,
  isViewingSharedResult = false,
  sharedUrl,
  onSelectTarget,
}: Props) {
  return (
    <div
      className="w-full lg:w-[420px] border-t-2 lg:border-t-0 overflow-y-auto"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
      }}
    >
      <div className="p-3">
        <div
          className="flex items-center gap-2 mb-3 text-xs uppercase tracking-widest border-b pb-2 text-zinc-400"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <span className="text-lime-400">//</span>{" "}
          <span className="font-pixel text-[10px]">SERVER REGIONS</span>
        </div>
        {isViewingSharedResult && sharedUrl && (
          <div
            className="mb-3 border border-cyan-700 px-3 py-2"
            style={{ backgroundColor: "rgba(8, 47, 73, 0.55)" }}
          >
            <div className="font-pixel text-[8px] uppercase tracking-widest text-cyan-300">
              Shared snapshot loaded
            </div>
            <div className="mt-1 text-xs font-mono text-cyan-100 break-all">
              {sharedUrl}
            </div>
          </div>
        )}
        <div className="space-y-2">
          {pingTargets.map((target, index) => {
            const isActive =
              testState.type === "running" &&
              testState.currentTargetIndex === index;
            const isSelected =
              testState.type === "complete" &&
              testState.selectedTargetIndex === index;
            const isBest =
              testState.type === "complete" &&
              testState.bestTargetIndex === index;
            const hasResults = !!pingResults[target.id];
            const hasFailed = !!pingResults[target.id]?.error;

            const cardStyle = {
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-primary)",
            };
            let cardClasses = "hover:border-opacity-80";
            let statusIndicator = null;
            let badge = null;

            if (hasFailed) {
              cardClasses =
                "border-l-4 border-l-red-500 border-t border-r border-b border-red-900";
              badge = (
                <span className="text-[10px] font-pixel bg-red-600 text-white px-2 py-0.5 uppercase">
                  FAILED
                </span>
              );
            } else if (isActive) {
              cardClasses = "border-l-[6px] border-t border-r border-b";
              statusIndicator = (
                <span className="text-orange-400 text-[10px] font-pixel animate-pulse">
                  ● ACTIVE
                </span>
              );
            } else if (isSelected) {
              cardClasses =
                "border-l-4 border-l-cyan-400 border-t border-r border-b border-cyan-700";
              badge = (
                <span className="text-[10px] font-pixel bg-cyan-600 text-white px-2 py-0.5 uppercase">
                  SELECTED
                </span>
              );
            } else if (isBest) {
              cardClasses =
                "border-l-4 border-l-lime-400 border-t border-r border-b border-lime-800";
              badge = (
                <span className="text-[10px] font-pixel bg-lime-600 text-black px-2 py-0.5 uppercase">
                  ★ BEST
                </span>
              );
            }

            let dcName = "---";
            const dcId = pingResults[target.id]?.dc_id;
            if (dcId) {
              dcName = datacenters.find((dc) => dc.id === dcId)?.name || "---";
            }

            const latency = pingResults[target.id]?.latencyAvg;
            const jitter = pingResults[target.id]?.latencyJitter;
            const onClick =
              testState.type === "complete"
                ? () => onSelectTarget(index)
                : undefined;

            return (
              <div
                key={target.id}
                className={`border p-3 ${cardClasses} ${testState.type === "complete" ? "cursor-pointer hover:brightness-110" : ""}`}
                style={cardStyle}
                onClick={onClick}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-pixel text-white uppercase text-[10px] tracking-wide">
                    {formatRegion(target.name)}
                  </span>
                  {statusIndicator}
                  {badge}
                </div>

                {hasFailed ? (
                  <div className="text-xs text-red-400 font-mono">
                    ✕ {pingResults[target.id].error}
                  </div>
                ) : hasResults ? (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div
                      className="p-2 border"
                      style={{
                        backgroundColor: "var(--bg-primary)",
                        borderColor: "var(--border-primary)",
                      }}
                    >
                      <div className="font-pixel text-[8px] mb-1 text-zinc-500">
                        PING
                      </div>
                      <div className="text-lg font-mono font-bold text-lime-400 tabular-nums">
                        {latency ? Math.round(latency) : "---"}
                        <span className="text-xs ml-0.5 text-zinc-500">ms</span>
                      </div>
                    </div>
                    <div
                      className="p-2 border"
                      style={{
                        backgroundColor: "var(--bg-primary)",
                        borderColor: "var(--border-primary)",
                      }}
                    >
                      <div className="font-pixel text-[8px] mb-1 text-zinc-500">
                        JITTER
                      </div>
                      <div className="text-lg font-mono font-bold text-cyan-400 tabular-nums">
                        {jitter
                          ? (Math.round(jitter * 10) / 10).toFixed(1)
                          : "---"}
                        <span className="text-xs ml-0.5 text-zinc-500">ms</span>
                      </div>
                    </div>
                    <div
                      className="p-2 border col-span-1"
                      style={{
                        backgroundColor: "var(--bg-primary)",
                        borderColor: "var(--border-primary)",
                      }}
                    >
                      <div className="font-pixel text-[8px] mb-1 text-zinc-500">
                        DC
                      </div>
                      <div className="text-sm font-mono font-bold text-orange-400 truncate">
                        {dcName.split(" ")[0]}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-mono text-zinc-500">
                    {testState.type === "waiting"
                      ? "> awaiting_test..."
                      : "> pending..."}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
