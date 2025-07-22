import { useEffect, useMemo, useRef, useState } from 'react';
import './index.css'
import MapChart, { type Mode } from './MapChart';
import datacenters from "./datacenters.json";

import { testPings, type PingSummary } from './ping_tester';
import TestResults from './TestResults';

const pingTargets = [
    {
      id: "gl4",
      name: "Global Anycast (free)",
      target: "//gl4.rt.playit.gg",
    },
    {
      id: "na4",
      name: "North America (premium)",
      target: "//na4.rt.playit.gg",
    },
    {
      id: "eu4",
      name: "Europe (premium)",
      target: "//eu4.rt.playit.gg",
    },
    {
      id: "as4",
      name: "Asia (premium)",
      target: "//as4.rt.playit.gg",
    },
    {
      id: "sa4",
      name: "South America (premium)",
      target: "//sa4.rt.playit.gg",
    },
    {
      id: "in4",
      name: "India (premium)",
      target: "//in4.rt.playit.gg",
    },
  ];

type TestState =
  { type: "waiting" }
  | { type: "running", currentTargetIndex: number }
  | { type: "complete", bestTargetIndex: number, selectedTargetIndex: number | undefined };

function App() {
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>(undefined);
  const [mode, setMode] = useState<Mode>({ type: "globe", location: userLocation || [0, 0] });
  const [pingResults, setPingResults] = useState<{[id: string]: PingSummary}>({});
  const [testState, setTestState] = useState<TestState>({
    type: 'waiting',
  });
  const [showResults, setShowResults] = useState(false);

  const testController = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      const res = await fetch('https://ipv4-check-perf.radar.cloudflare.com/api/info', { signal });
      const json = await res.json();
      if (typeof json.latitude === "string" && typeof json.longitude === "string") {
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
            highlightedDcd: pingResults[pingTargets[testState.bestTargetIndex].id].dc_id,
          };
        }

        return {
          type: "dc-focus",
          dcId: pingResults[pingTargets[testState.selectedTargetIndex].id].dc_id,
        };
      }

      return mode;
    });
  }, [
    userLocation && userLocation[0] || 0,
    userLocation && userLocation[1] || 0,
    testState.type,
    testState.type === "complete" && testState.selectedTargetIndex,
  ]);

  const stopTest = useMemo(() => () => {
    if (testController.current) {
      testController.current.abort();
    }
    
    setTestState({
      type: "waiting",
    });
  }, [setTestState]);

  const startTest = async () => {
    if (testController.current) {
      testController.current.abort();
    }
    testController.current = new AbortController();

    const location = userLocation;
    if (!location) {
      alert('location not loaded, test not ready');
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

      setPingResults(r => {
        const copy = {...r};
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
              type: 'ping-region',
              location: userLocation,
              target: { dc_id: summary.dc_id, region: summary.region },
            });
          }

          setPingResults(r => ({
            [targetDetails.id]: summary,
            ...r
          }));
        }
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

  return (
    <div>
      { showResults && <TestResults onClose={() => setShowResults(false)} pingResults={pingResults} /> }
      <div className="header">
        <a href="https://playit.gg">Playit.gg</a> Latency Tool
        <div className="grow" />
        { testState.type === "running" ? <button className="stop" onClick={stopTest}>Stop Test</button> : <button onClick={startTest}>Start Test</button> }
        { testState.type === "complete" ? <button className="show-results" onClick={() => setShowResults(true)}>Show Results</button> : null }
        
      </div>
      <div className="content">
        <div className="body">
        <MapChart mode={mode} />
        </div>
        <div className="details">
          {
            pingTargets.map((target, i) => {
              
              let regionCls = "region";
              if (testState.type === "running" && testState.currentTargetIndex === i) {
                regionCls = "region active";
              } else if (testState.type === "complete" && testState.selectedTargetIndex === i) {
                regionCls = "region selected";
              }  else if (testState.type === "complete" && testState.bestTargetIndex === i) {
                regionCls = "region best";
              }

              let dcName = '?';
              const dcId = pingResults[target.id]?.dc_id;
              if (dcId) {
                dcName = datacenters.find(d => d.id === dcId)?.name || '?';
              }

              const pLatency = (l?: number, l2?: number): string => {
                if (!l) {
                  return '?';
                }
                if (!l2) {
                  return `${(Math.round(l * 10.0)/10.0).toFixed(1)}ms`;
                }
                return `${(Math.round(l * 10.0)/10.0).toFixed(1)}/${(Math.round(l2 * 10.0)/10.0).toFixed(1)}ms`;
              };

              let style = undefined;
              let onClick = undefined;

              if (testState.type === "complete") {
                style = {cursor: "pointer"};

                onClick = () => {
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
                };
              }

              return (
                <div key={target.id} className={regionCls} style={style} onClick={onClick}>
                  <div className="title">{target.name}</div>
                  <div className="data">
                    <div className="attribute">
                      <span>Datacenter: </span> { dcName }
                    </div>
                    <div className="attribute">
                      <span>Average Latency: </span> { pLatency(pingResults[target.id]?.latencyAvg) }
                    </div>
                    <div className="attribute">
                      <span>Latency Range (High/Low): </span> { pLatency(pingResults[target.id]?.latencyMax, pingResults[target.id]?.latencyMin) }
                    </div>
                    <div className="attribute">
                      <span>Latency Jitter: </span> { pLatency(pingResults[target.id]?.latencyJitter) }
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}

export default App;
