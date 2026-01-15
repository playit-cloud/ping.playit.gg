import { useEffect, useMemo, useRef, useState } from "react";
import "./index.css";
import MapChart, { type Mode } from "./MapChart";
import datacenters from "./pingDcs";
import playitLogo from "./images/playit-logo.png";

import { testPings, type PingSummary } from "./ping_tester";
import TestResults from "./TestResults";
import pingTargets from "./pingTargets";

type TestState =
  | { type: "waiting" }
  | { type: "running"; currentTargetIndex: number }
  | {
      type: "complete";
      bestTargetIndex: number;
      selectedTargetIndex: number | undefined;
    };

function App() {
  const [userLocation, setUserLocation] = useState<
    [number, number] | undefined
  >(undefined);
  const [mode, setMode] = useState<Mode>({
    type: "globe",
    location: userLocation || [0, 0],
  });
  const [pingResults, setPingResults] = useState<{ [id: string]: PingSummary }>(
    {},
  );
  const [testState, setTestState] = useState<TestState>({
    type: "waiting",
  });
  const [showResults, setShowResults] = useState(false);

  const testController = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      const res = await fetch(
        "https://ipv4-check-perf.radar.cloudflare.com/api/info",
        { signal },
      );
      const json = await res.json();
      if (
        typeof json.latitude === "string" &&
        typeof json.longitude === "string"
      ) {
        setUserLocation([+json.longitude, +json.latitude]);
      } else {
        console.log("Cloudflare Response: ", json);
        alert("failed to get your location details from Cloudflare");
      }
    })();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    setMode((mode: Mode): Mode => {
      if (userLocation === undefined) {
        return mode;
      }

      if (testState.type === "waiting") {
        return {
          type: "globe",
          location: userLocation,
        };
      }

      if (testState.type === "running" && mode.type === "ping-region") {
        return {
          ...mode,
          location: userLocation,
        };
      }

      if (testState.type === "complete") {
        if (testState.selectedTargetIndex === undefined) {
          return {
            type: "globe",
            location: userLocation,
            highlightedDcd:
              pingResults[pingTargets[testState.bestTargetIndex].id].dc_id,
          };
        }

        return {
          type: "dc-focus",
          dcId: pingResults[pingTargets[testState.selectedTargetIndex].id]
            .dc_id,
        };
      }

      return mode;
    });
  }, [
    (userLocation && userLocation[0]) || 0,
    (userLocation && userLocation[1]) || 0,
    testState.type,
    testState.type === "complete" && testState.selectedTargetIndex,
  ]);

  const stopTest = useMemo(
    () => () => {
      if (testController.current) {
        testController.current.abort();
      }

      setTestState({
        type: "waiting",
      });
    },
    [setTestState],
  );

  const startTest = async (onlyIfWaiting?: boolean) => {
    if (testController.current) {
      if (onlyIfWaiting) {
        return;
      }
      testController.current.abort();
    }
    testController.current = new AbortController();

    const location = userLocation;
    if (!location) {
      alert("location not loaded, test not ready");
      return;
    }

    const signal = testController.current.signal;
    let bestIndex = 0;
    let bestLatency = 0;

    for (let i = 0; i < pingTargets.length; ++i) {
      setTestState({
        type: "running",
        currentTargetIndex: i,
      });

      setPingResults((r) => {
        const copy = { ...r };
        delete copy[targetDetails.id];
        return copy;
      });

      const targetDetails = pingTargets[i];
      let modeSet = false;

      const result = await testPings(targetDetails.target, {
        signal,
        onUpdate: (summary) => {
          if (!modeSet) {
            modeSet = true;

            setMode({
              type: "ping-region",
              location: userLocation,
              target: { dc_id: summary.dc_id, region: summary.region },
            });
          }

          setPingResults((r) => ({
            [targetDetails.id]: summary,
            ...r,
          }));
        },
      });

      // Skip failed results when determining best
      if (!result.error) {
        if (bestLatency === 0 || result.latencyAvg < bestLatency) {
          bestIndex = i;
          bestLatency = result.latencyAvg;
        }
      }
    }

    setTestState({
      type: "complete",
      selectedTargetIndex: undefined,
      bestTargetIndex: bestIndex,
    });

    setShowResults(true);
  };

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    const tid = setTimeout(() => {
      startTest(true);
    }, 100);

    return () => clearTimeout(tid);
  }, [userLocation]);

  return (
    <div className="text-gray-100 min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {showResults && (
        <TestResults
          onClose={() => setShowResults(false)}
          pingResults={pingResults}
        />
      )}

      {/* Header */}
      <header className="px-4 md:px-6 h-14 flex items-center justify-between border-b-2 border-orange-500 sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-4">
          <a href="https://playit.gg" className="flex items-center no-underline">
            <img src={playitLogo} alt="playit.gg" className="h-9" />
          </a>
          <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-500">
            <span className="text-orange-500">&gt;</span>
            <span className="text-cyan-400 font-pixel text-xs">LATENCY_TESTER</span>
            <span className="animate-pulse">_</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {testState.type === "running" ? (
            <button
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 border-2 border-red-400 text-white font-pixel text-[10px] uppercase tracking-wide cursor-pointer"
              onClick={stopTest}
            >
              [X] STOP
            </button>
          ) : (
            <button
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 border-2 border-orange-400 text-white font-pixel text-[10px] uppercase tracking-wide cursor-pointer"
              onClick={() => startTest()}
            >
              [▶] RUN TEST
            </button>
          )}
          {testState.type === "complete" && (
            <button
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-700 hover:bg-cyan-600 border-2 border-cyan-400 text-white font-pixel text-[10px] uppercase tracking-wide cursor-pointer"
              onClick={() => setShowResults(true)}
            >
              [◆] RESULTS
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)]">
        {/* Map Area */}
        <div className="flex-1 min-h-[300px] lg:min-h-0 relative border-r-2" style={{ borderColor: 'var(--border-primary)' }}>
          <MapChart mode={mode} />
          {/* Map overlay with status */}
          {testState.type === "running" && (
            <div className="absolute top-3 left-3 border-2 border-cyan-500 px-3 py-2 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-primary)', opacity: 0.95 }}>
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

        {/* Sidebar */}
        <div className="w-full lg:w-[420px] border-t-2 lg:border-t-0 overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-widest border-b pb-2 text-zinc-400" style={{ borderColor: 'var(--border-primary)' }}>
              <span className="text-lime-400">//</span> <span className="font-pixel text-[10px]">SERVER REGIONS</span>
            </div>
            <div className="space-y-2">
              {pingTargets.map((target, i) => {
                const isActive =
                  testState.type === "running" &&
                  testState.currentTargetIndex === i;
                const isSelected =
                  testState.type === "complete" &&
                  testState.selectedTargetIndex === i;
                const isBest =
                  testState.type === "complete" &&
                  testState.bestTargetIndex === i;
                const hasResults = !!pingResults[target.id];
                const hasFailed = !!pingResults[target.id]?.error;

                let cardStyle = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' };
                let cardClasses = "hover:border-opacity-80";
                let statusIndicator = null;
                let badge = null;

                if (hasFailed) {
                  cardClasses = "border-l-4 border-l-red-500 border-t border-r border-b border-red-900";
                  badge = (
                    <span className="text-[10px] font-pixel bg-red-600 text-white px-2 py-0.5 uppercase">
                      FAILED
                    </span>
                  );
                } else if (isActive) {
                  cardClasses = "border-l-4 border-l-orange-500 border-t border-r border-b";
                  cardStyle = { ...cardStyle, borderColor: 'var(--border-primary)' };
                  statusIndicator = (
                    <span className="text-orange-400 text-[10px] font-pixel animate-pulse">
                      ● ACTIVE
                    </span>
                  );
                } else if (isSelected) {
                  cardClasses = "border-l-4 border-l-cyan-400 border-t border-r border-b border-cyan-700";
                  badge = (
                    <span className="text-[10px] font-pixel bg-cyan-600 text-white px-2 py-0.5 uppercase">
                      SELECTED
                    </span>
                  );
                } else if (isBest) {
                  cardClasses = "border-l-4 border-l-lime-400 border-t border-r border-b border-lime-800";
                  badge = (
                    <span className="text-[10px] font-pixel bg-lime-600 text-black px-2 py-0.5 uppercase">
                      ★ BEST
                    </span>
                  );
                }

                let dcName = "---";
                const dcId = pingResults[target.id]?.dc_id;
                if (dcId) {
                  dcName = datacenters.find((d) => d.id === dcId)?.name || "---";
                }

                const latency = pingResults[target.id]?.latencyAvg;
                const jitter = pingResults[target.id]?.latencyJitter;

                const onClick =
                  testState.type === "complete"
                    ? () => {
                        setTestState((s: TestState): TestState => {
                          if (s.type !== "complete") {
                            return s;
                          }
                          if (s.selectedTargetIndex === i) {
                            return {
                              type: "complete",
                              selectedTargetIndex: undefined,
                              bestTargetIndex: s.bestTargetIndex,
                            };
                          }
                          return {
                            type: "complete",
                            selectedTargetIndex: i,
                            bestTargetIndex: s.bestTargetIndex,
                          };
                        });
                      }
                    : undefined;

                return (
                  <div
                    key={target.id}
                    className={`border p-3 ${cardClasses} ${testState.type === "complete" ? "cursor-pointer hover:brightness-110" : ""}`}
                    style={cardStyle}
                    onClick={onClick}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-pixel text-white uppercase text-[10px] tracking-wide">
                        {target.name}
                      </span>
                      {statusIndicator}
                      {badge}
                    </div>

                    {/* Stats */}
                    {hasFailed ? (
                      <div className="text-xs text-red-400 font-mono">
                        ✕ {pingResults[target.id].error}
                      </div>
                    ) : hasResults ? (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2 border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
                          <div className="font-pixel text-[8px] mb-1 text-zinc-500">PING</div>
                          <div className="text-lg font-mono font-bold text-lime-400 tabular-nums">
                            {latency ? Math.round(latency) : "---"}
                            <span className="text-xs ml-0.5 text-zinc-500">
                              ms
                            </span>
                          </div>
                        </div>
                        <div className="p-2 border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
                          <div className="font-pixel text-[8px] mb-1 text-zinc-500">JITTER</div>
                          <div className="text-lg font-mono font-bold text-cyan-400 tabular-nums">
                            {jitter ? (Math.round(jitter * 10) / 10).toFixed(1) : "---"}
                            <span className="text-xs ml-0.5 text-zinc-500">
                              ms
                            </span>
                          </div>
                        </div>
                        <div className="p-2 border col-span-1" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
                          <div className="font-pixel text-[8px] mb-1 text-zinc-500">DC</div>
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
      </div>
    </div>
  );
}

export default App;
