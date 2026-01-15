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

      if (i === 0) {
        bestLatency = result.latencyAvg;
      } else if (result.latencyAvg < bestLatency) {
        bestIndex = i;
        bestLatency = result.latencyAvg;
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
    <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 text-white antialiased min-h-screen">
      {showResults && (
        <TestResults
          onClose={() => setShowResults(false)}
          pingResults={pingResults}
        />
      )}

      {/* Header */}
      <header className="px-4 md:px-6 h-16 flex items-center justify-between border-b border-neutral-700/50 bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <a
            href="https://playit.gg"
            className="flex items-center no-underline"
          >
            <img
              src={playitLogo}
              alt="playit.gg"
              className="h-10"
            />
          </a>
          <span className="text-neutral-500 hidden sm:inline">|</span>
          <span className="text-neutral-400 text-sm hidden sm:inline">
            Latency Tester
          </span>
        </div>

        <div className="flex items-center gap-2">
          {testState.type === "running" ? (
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors cursor-pointer"
              onClick={stopTest}
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Stop
            </button>
          ) : (
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-medium rounded-lg transition-all cursor-pointer shadow-lg shadow-orange-500/20"
              onClick={() => startTest()}
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              Start Test
            </button>
          )}
          {testState.type === "complete" && (
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
              onClick={() => setShowResults(true)}
            >
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Results
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
        {/* Map Area */}
        <div className="flex-1 min-h-[300px] lg:min-h-0 relative">
          <MapChart mode={mode} />
          {/* Map overlay with status */}
          {testState.type === "running" && (
            <div className="absolute top-4 left-4 bg-neutral-900/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-3 border border-neutral-700">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
              <span className="text-sm text-neutral-200">
                Testing {pingTargets[testState.currentTargetIndex]?.name}...
              </span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 bg-neutral-800/50 border-t lg:border-t-0 lg:border-l border-neutral-700/50 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Regions
            </h2>
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

                let cardClasses =
                  "bg-neutral-800/80 border-neutral-700 hover:border-neutral-600";
                let statusDot = null;
                let badge = null;

                if (isActive) {
                  cardClasses =
                    "bg-gradient-to-r from-orange-950/80 to-amber-950/50 border-orange-700";
                  statusDot = (
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  );
                } else if (isSelected) {
                  cardClasses =
                    "bg-gradient-to-r from-blue-950/80 to-indigo-950/50 border-blue-600 ring-1 ring-blue-500/30";
                  badge = (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-medium">
                      Selected
                    </span>
                  );
                } else if (isBest) {
                  cardClasses =
                    "bg-gradient-to-r from-green-950/80 to-emerald-950/50 border-green-700";
                  badge = (
                    <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-medium">
                      Best
                    </span>
                  );
                }

                let dcName = "—";
                const dcId = pingResults[target.id]?.dc_id;
                if (dcId) {
                  dcName = datacenters.find((d) => d.id === dcId)?.name || "—";
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
                    className={`rounded-lg border p-4 transition-all ${cardClasses} ${testState.type === "complete" ? "cursor-pointer" : ""}`}
                    onClick={onClick}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {statusDot}
                        <span className="font-semibold text-white">
                          {target.name}
                        </span>
                      </div>
                      {badge}
                    </div>

                    {/* Stats Grid */}
                    {hasResults ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-neutral-500 mb-0.5">
                            Latency
                          </div>
                          <div className="text-xl font-bold text-white">
                            {latency ? `${Math.round(latency)}` : "—"}
                            <span className="text-sm font-normal text-neutral-400 ml-0.5">
                              ms
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500 mb-0.5">
                            Jitter
                          </div>
                          <div className="text-xl font-bold text-white">
                            {jitter ? `${Math.round(jitter * 10) / 10}` : "—"}
                            <span className="text-sm font-normal text-neutral-400 ml-0.5">
                              ms
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs text-neutral-500 mb-0.5">
                            Datacenter
                          </div>
                          <div className="text-sm text-neutral-300">
                            {dcName}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-neutral-500 italic">
                        {testState.type === "waiting"
                          ? "Waiting for test..."
                          : "Pending..."}
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
