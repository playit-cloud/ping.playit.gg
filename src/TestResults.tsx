import type { PingSummary } from "./ping_tester";

type Props = {
  onClose?: () => void;
  pingResults: { [id: string]: PingSummary };
};

export default function TestResults({ onClose, pingResults }: Props) {
  const values = Object.values(pingResults);
  const bestLatency = Math.min(...values.map((v) => v.latencyAvg));

  const gl = pingResults["GlobalAnycast"];
  const best = values.find((v) => v.latencyAvg === bestLatency);

  if (!best) {
    throw new Error("cannot find best DC");
  }

  const bestIsGl = pingResults["GlobalAnycast"] === best;
  const glSameDc = gl.dc_id == best?.dc_id;

  const glInGame = gl.latencyAvg + best.latencyAvg;
  const bestInGame = best.latencyAvg * 2;
  const savings = Math.round(gl.latencyAvg - best.latencyAvg);
  const speedup = (gl.latencyAvg / best.latencyAvg).toFixed(1);
  const inGameSpeedup = (glInGame / bestInGame).toFixed(1);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-xl shadow-2xl cursor-auto max-h-[90vh] overflow-y-auto"
        onClick={(evt) => evt.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-700 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white m-0">
              Latency Results
            </h1>
            <p className="text-neutral-400 text-sm mt-1 mb-0">
              Your connection analysis to playit.gg servers
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Global Anycast Card */}
            <div className="bg-neutral-700/50 rounded-lg p-4 border border-neutral-600">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-neutral-300 text-sm font-medium uppercase tracking-wide">
                  Global Anycast
                </span>
                <span className="ml-auto text-xs bg-neutral-600 text-neutral-300 px-2 py-0.5 rounded">
                  Free
                </span>
              </div>
              <div className="text-4xl font-bold text-white mb-1">
                ~{Math.round(gl.latencyAvg)}
                <span className="text-lg text-neutral-400 ml-1">ms</span>
              </div>
              <div className="text-sm text-neutral-400">
                via <span className="text-neutral-200">{gl.dc}</span>
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {gl.region} region
              </div>
            </div>

            {/* Best Regional Card */}
            <div
              className={`rounded-lg p-4 border ${glSameDc || bestIsGl ? "bg-neutral-700/50 border-neutral-600" : "bg-gradient-to-br from-orange-950/80 to-amber-950/50 border-orange-700"}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-neutral-300 text-sm font-medium uppercase tracking-wide">
                  Best Regional
                </span>
                {!(glSameDc || bestIsGl) && (
                  <span className="ml-auto text-xs bg-orange-600 text-white px-2 py-0.5 rounded font-medium">
                    Premium
                  </span>
                )}
              </div>
              <div className="text-4xl font-bold text-white mb-1">
                ~{Math.round(best.latencyAvg)}
                <span className="text-lg text-neutral-400 ml-1">ms</span>
              </div>
              <div className="text-sm text-neutral-400">
                via <span className="text-neutral-200">{best.dc}</span>
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {best.region} region
              </div>
            </div>
          </div>

          {/* Conditional Content */}
          {glSameDc || bestIsGl ? (
            /* Already optimal routing */
            <div className="bg-green-950/40 border border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-green-400 font-semibold mb-1">
                    Optimal Routing
                  </h3>
                  <p className="text-neutral-300 text-sm leading-relaxed m-0">
                    Great news! Your ISP is already routing you to the best
                    available datacenter. A regional tunnel wouldn't improve
                    your connection speed.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Can improve with premium */
            <>
              {/* Savings Banner */}
              <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-white/80 text-sm font-medium mb-1">
                      Potential Improvement
                    </div>
                    <div className="text-white text-2xl font-bold">
                      Save ~{savings}ms ({speedup}x faster)
                    </div>
                  </div>
                  <a
                    href="https://playit.gg/account/billing/shop/premium"
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 font-bold px-5 py-2.5 rounded-lg hover:bg-orange-50 transition-colors no-underline"
                  >
                    Get Premium
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </a>
                </div>
              </div>

              {/* In-Game Latency Comparison */}
              <div className="bg-neutral-800/50 rounded-lg p-5 border border-neutral-700">
                <h3 className="text-neutral-300 text-sm font-medium uppercase tracking-wide mb-4">
                  Expected In-Game Latency
                </h3>
                <div className="space-y-4">
                  {/* Global bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-neutral-400">
                        Global Anycast (Free)
                      </span>
                      <span className="text-white font-semibold">
                        ~{Math.round(glInGame)}ms
                      </span>
                    </div>
                    <div className="h-3 bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </div>
                  {/* Premium bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-neutral-400">
                        {best.region} Regional (Premium)
                      </span>
                      <span className="text-orange-400 font-semibold">
                        ~{Math.round(bestInGame)}ms
                      </span>
                    </div>
                    <div className="h-3 bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                        style={{
                          width: `${Math.round((bestInGame / glInGame) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-700 text-center">
                  <span className="text-2xl font-bold text-orange-400">
                    {inGameSpeedup}x
                  </span>
                  <span className="text-neutral-400 ml-2">less latency</span>
                </div>
              </div>
            </>
          )}

          {/* Info Note */}
          <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700/50">
            <p className="text-neutral-400 text-sm leading-relaxed m-0">
              These measurements show your connection to playit.gg servers.
              Actual in-game latency depends on both your connection and the
              game host's connection.{" "}
              <a
                href="https://playit.gg/support/how-to-lower-ping/"
                target="_blank"
                className="text-orange-400 hover:text-orange-300"
              >
                Learn more about lowering ping
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
