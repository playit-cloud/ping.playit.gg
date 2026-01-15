import type { PingSummary } from "./ping_tester";

type Props = {
  onClose?: () => void;
  pingResults: { [id: string]: PingSummary };
};

export default function TestResults({ onClose, pingResults }: Props) {
  const values = Object.values(pingResults);
  // Filter out failed regions for calculations
  const successfulValues = values.filter((v) => !v.error);
  const bestLatency =
    successfulValues.length > 0
      ? Math.min(...successfulValues.map((v) => v.latencyAvg))
      : 0;

  const gl = pingResults["GlobalAnycast"];
  const glFailed = !gl || !!gl.error;
  const best = successfulValues.find((v) => v.latencyAvg === bestLatency);
  const bestFailed = !best;

  // Safe values for calculations (fallback to 0 if failed)
  const glLatency = glFailed ? 0 : gl.latencyAvg;
  const bestLatencyVal = bestFailed ? 0 : best.latencyAvg;

  const bestIsGl = !glFailed && !bestFailed && gl === best;
  const glSameDc = !glFailed && !bestFailed && gl.dc_id === best.dc_id;

  const glInGame = glLatency + bestLatencyVal;
  const bestInGame = bestLatencyVal * 2;
  const savings = Math.round(glLatency - bestLatencyVal);
  const speedup =
    bestLatencyVal > 0 ? (glLatency / bestLatencyVal).toFixed(1) : "0";
  const inGameSpeedup =
    bestInGame > 0 ? (glInGame / bestInGame).toFixed(1) : "0";

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-pointer font-mono"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-zinc-900 border-2 border-orange-500 cursor-auto max-h-[90vh] overflow-y-auto shadow-2xl shadow-orange-500/20"
        onClick={(evt) => evt.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b-2 border-zinc-700 flex items-center justify-between bg-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-orange-500 text-xl">◆</span>
            <div>
              <h1 className="text-xl font-bold text-white m-0 uppercase tracking-wide">
                PING RESULTS
              </h1>
              <p className="text-zinc-400 text-xs mt-1 mb-0">
                // connection analysis complete
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-700 hover:bg-red-600 border-2 border-zinc-500 hover:border-red-400 text-zinc-200 hover:text-white font-bold text-sm cursor-pointer transition-colors"
          >
            [ESC]
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Global Anycast Card */}
            {glFailed ? (
              <div className="bg-zinc-950 border-l-4 border-l-red-500 border-t border-r border-b border-red-900 p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-red-400 text-sm font-bold uppercase tracking-wider">
                    GLOBAL ANYCAST
                  </span>
                  <span className="text-xs bg-red-600 text-white px-2.5 py-1 font-bold uppercase">
                    FAILED
                  </span>
                </div>
                <div className="text-2xl font-bold text-red-400 mb-3">
                  CONNECTION FAILED
                </div>
                <div className="text-sm text-zinc-400 border-t border-zinc-700 pt-3">
                  <p className="m-0">
                    {gl?.error || "Unable to reach server. Please try again."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950 border-l-4 border-l-sky-500 border-t border-r border-b border-zinc-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sky-400 text-sm font-bold uppercase tracking-wider">
                    GLOBAL ANYCAST
                  </span>
                  <span className="text-xs bg-zinc-700 text-zinc-200 px-2.5 py-1 font-bold uppercase">
                    FREE
                  </span>
                </div>
                <div className="text-5xl font-bold text-white mb-3 tabular-nums">
                  {Math.round(gl.latencyAvg)}
                  <span className="text-xl text-zinc-400 ml-1 font-normal">
                    ms
                  </span>
                </div>
                <div className="text-sm text-zinc-300 space-y-1.5 border-t border-zinc-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Datacenter</span>
                    <span className="text-white">{gl.dc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Region</span>
                    <span className="text-sky-400">{gl.region}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Best Regional Card */}
            {bestFailed ? (
              <div className="bg-zinc-950 border-l-4 border-l-red-500 border-t border-r border-b border-red-900 p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-red-400 text-sm font-bold uppercase tracking-wider">
                    BEST REGIONAL
                  </span>
                  <span className="text-xs bg-red-600 text-white px-2.5 py-1 font-bold uppercase">
                    FAILED
                  </span>
                </div>
                <div className="text-2xl font-bold text-red-400 mb-3">
                  ALL REGIONS FAILED
                </div>
                <div className="text-sm text-zinc-400 border-t border-zinc-700 pt-3">
                  <p className="m-0">
                    Unable to reach any regional servers. Please check your
                    connection and try again.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={`bg-zinc-950 border-l-4 border-t border-r border-b border-zinc-700 p-4 ${glSameDc || bestIsGl ? "border-l-zinc-600" : "border-l-emerald-500"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-sm font-bold uppercase tracking-wider ${glSameDc || bestIsGl ? "text-zinc-400" : "text-emerald-400"}`}
                  >
                    BEST REGIONAL
                  </span>
                  {!(glSameDc || bestIsGl) && (
                    <span className="text-xs bg-orange-600 text-white px-2.5 py-1 font-bold uppercase">
                      PREMIUM
                    </span>
                  )}
                </div>
                <div
                  className={`text-5xl font-bold mb-3 tabular-nums ${glSameDc || bestIsGl ? "text-zinc-400" : "text-white"}`}
                >
                  {Math.round(best.latencyAvg)}
                  <span className="text-xl text-zinc-400 ml-1 font-normal">
                    ms
                  </span>
                </div>
                <div className="text-sm text-zinc-300 space-y-1.5 border-t border-zinc-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Datacenter</span>
                    <span className="text-white">{best.dc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Region</span>
                    <span
                      className={
                        glSameDc || bestIsGl ? "text-zinc-400" : "text-emerald-400"
                      }
                    >
                      {best.region}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Conditional Content */}
          {glFailed || bestFailed ? (
            /* Connection errors occurred */
            <div className="bg-red-950/50 border-2 border-red-600 p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-red-400 text-2xl">!</span>
                <span className="text-red-300 font-bold uppercase text-base tracking-wide">
                  CONNECTION ISSUES DETECTED
                </span>
              </div>
              <p className="text-zinc-300 text-sm m-0 leading-relaxed">
                Some servers could not be reached during testing. This may be
                due to network issues or temporary server unavailability. Please
                try running the test again.
              </p>
            </div>
          ) : glSameDc || bestIsGl ? (
            /* Already optimal routing */
            <div className="bg-emerald-950/50 border-2 border-emerald-600 p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-emerald-400 text-2xl">✓</span>
                <span className="text-emerald-300 font-bold uppercase text-base tracking-wide">
                  OPTIMAL ROUTE DETECTED
                </span>
              </div>
              <p className="text-zinc-300 text-sm m-0 leading-relaxed">
                Your ISP is already routing you to the best available
                datacenter. A regional tunnel would not improve your connection
                speed.
              </p>
            </div>
          ) : (
            /* Can improve with premium */
            <>
              {/* Savings Banner */}
              <div className="bg-gradient-to-r from-orange-700 to-orange-600 border-2 border-orange-400 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span>▲</span> UPGRADE AVAILABLE
                    </div>
                    <div className="text-white text-2xl font-bold tracking-wide">
                      SAVE {savings}ms — {speedup}x FASTER
                    </div>
                  </div>
                  <a
                    href="https://playit.gg/account/billing/shop/premium"
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 bg-white text-orange-700 font-bold px-5 py-2.5 hover:bg-orange-100 transition-colors no-underline uppercase text-sm tracking-wide"
                  >
                    [★] GET PREMIUM
                  </a>
                </div>
              </div>

              {/* In-Game Latency Comparison */}
              <div className="bg-zinc-950 border-2 border-zinc-700 p-5">
                <div className="text-zinc-300 text-sm font-bold uppercase tracking-wider mb-5">
                  <span className="text-orange-500">//</span> IN-GAME LATENCY
                  ESTIMATE
                </div>
                <div className="space-y-5">
                  {/* Global bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-300">
                        Global Anycast{" "}
                        <span className="text-zinc-500">[FREE]</span>
                      </span>
                      <span className="text-white font-bold tabular-nums text-lg">
                        {Math.round(glInGame)}
                        <span className="text-zinc-400 text-sm ml-0.5">ms</span>
                      </span>
                    </div>
                    <div className="h-5 bg-zinc-800 border border-zinc-600 overflow-hidden">
                      <div
                        className="h-full bg-sky-600"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </div>
                  {/* Premium bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-300">
                        {best.region} Regional{" "}
                        <span className="text-orange-400">[PREMIUM]</span>
                      </span>
                      <span className="text-emerald-400 font-bold tabular-nums text-lg">
                        {Math.round(bestInGame)}
                        <span className="text-zinc-400 text-sm ml-0.5">ms</span>
                      </span>
                    </div>
                    <div className="h-5 bg-zinc-800 border border-zinc-600 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${Math.round((bestInGame / glInGame) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t-2 border-zinc-700 flex items-center justify-center gap-4">
                  <span className="text-4xl font-bold text-orange-400 tabular-nums">
                    {inGameSpeedup}x
                  </span>
                  <span className="text-zinc-300 uppercase text-sm font-medium">
                    Less Latency
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Info Note */}
          <div className="bg-zinc-800 border border-zinc-600 p-4">
            <p className="text-zinc-300 text-sm leading-relaxed m-0">
              <span className="text-zinc-500">&gt;</span> Results show your
              connection to playit.gg servers. Actual in-game latency depends on
              both your connection and the game host's.{" "}
              <a
                href="https://playit.gg/support/how-to-lower-ping/"
                target="_blank"
                className="text-orange-400 hover:text-orange-300 hover:underline"
              >
                [LEARN MORE]
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
