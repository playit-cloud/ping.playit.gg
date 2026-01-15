import { useEffect, useMemo, useRef, useState } from "react";
import "./index.css";
import MapChart, { type Mode } from "./MapChart";
import datacenters from "./pingDcs";

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

  const baseButtonClasses =
    "px-3 py-0.5 text-white font-bold rounded-sm border-2 cursor-pointer text-sm hover:border-white";

  return (
    <div className="bg-neutral-900 text-white/90 antialiased">
      {showResults && (
        <TestResults
          onClose={() => setShowResults(false)}
          pingResults={pingResults}
        />
      )}
      <div className="px-5 py-1 text-lg font-bold border-b-2 border-orange-500 flex items-center h-12 box-border">
        <a href="https://playit.gg">Playit.gg</a> Latency Tool
        <div className="grow" />
        {testState.type === "running" ? (
          <button
            className={`${baseButtonClasses} bg-red-600 border-red-600`}
            onClick={stopTest}
          >
            Stop Test
          </button>
        ) : (
          <button
            className={`${baseButtonClasses} bg-orange-500 border-orange-500`}
            onClick={() => startTest()}
          >
            Start Test
          </button>
        )}
        {testState.type === "complete" ? (
          <button
            className={`${baseButtonClasses} bg-cyan-700 border-cyan-700 ml-2`}
            onClick={() => setShowResults(true)}
          >
            Show Results
          </button>
        ) : null}
      </div>
      <div className="flex flex-row max-md:flex-col justify-start pt-0.5 max-h-[calc(100vh-50px)] max-md:max-h-none max-md:overflow-y-auto max-md:min-h-screen overflow-hidden box-border">
        <div className="grow-[5] min-w-[400px] max-h-[745px]">
          <MapChart mode={mode} />
        </div>
        <div className="min-w-[250px] basis-[300px] max-md:basis-auto grow max-h-full max-md:max-h-none max-md:overflow-y-visible overflow-y-auto overflow-x-hidden">
          {pingTargets.map((target, i) => {
            const isActive =
              testState.type === "running" &&
              testState.currentTargetIndex === i;
            const isSelected =
              testState.type === "complete" &&
              testState.selectedTargetIndex === i;
            const isBest =
              testState.type === "complete" && testState.bestTargetIndex === i;

            let regionBgClass = "bg-neutral-800";
            if (isActive) {
              regionBgClass = "bg-amber-900";
            } else if (isSelected) {
              regionBgClass = "bg-indigo-900";
            } else if (isBest) {
              regionBgClass = "bg-green-900";
            }

            let dcName = "?";
            const dcId = pingResults[target.id]?.dc_id;
            if (dcId) {
              dcName = datacenters.find((d) => d.id === dcId)?.name || "?";
            }

            const pLatency = (l?: number, l2?: number): string => {
              if (!l) {
                return "?";
              }
              if (!l2) {
                return `${(Math.round(l * 10.0) / 10.0).toFixed(1)}ms`;
              }
              return `${(Math.round(l * 10.0) / 10.0).toFixed(1)}/${(Math.round(l2 * 10.0) / 10.0).toFixed(1)}ms`;
            };

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
                className={`w-full float-left ${regionBgClass} mb-1 border-b-2 border-neutral-500 p-1 ${testState.type === "complete" ? "cursor-pointer" : ""}`}
                onClick={onClick}
              >
                <div className="font-bold">{target.name}</div>
                <div className="text-sm">
                  <div>
                    <span className="font-bold text-neutral-400">
                      Datacenter:{" "}
                    </span>{" "}
                    {dcName}
                  </div>
                  <div>
                    <span className="font-bold text-neutral-400">
                      Average Latency:{" "}
                    </span>{" "}
                    {pLatency(pingResults[target.id]?.latencyAvg)}
                  </div>
                  <div>
                    <span className="font-bold text-neutral-400">
                      Latency Range (High/Low):{" "}
                    </span>{" "}
                    {pLatency(
                      pingResults[target.id]?.latencyMax,
                      pingResults[target.id]?.latencyMin,
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-neutral-400">
                      Latency Jitter:{" "}
                    </span>{" "}
                    {pLatency(pingResults[target.id]?.latencyJitter)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
