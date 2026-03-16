import { useCallback, useEffect, useRef, useState } from "react";
import type { Mode } from "@/components/MapChart";
import { testPings } from "@/api/pingTester";
import pingTargets from "@/shared/pingTargets";
import {
  getBestTargetIndex,
  normalizeSelectedTargetIndex,
  type TestState,
} from "@/shared/testState";
import type { ShareSnapshot } from "@/shared/shareTypes";

type UsePingSessionOptions = {
  userLocation?: [number, number];
  displayLocation?: [number, number];
  autoStart?: boolean;
  onBeforeStart?: () => void;
};

export function usePingSession({
  userLocation,
  displayLocation,
  autoStart = false,
  onBeforeStart,
}: UsePingSessionOptions) {
  const [mode, setMode] = useState<Mode>({
    type: "globe",
    location: [0, 0],
  });
  const [pingResults, setPingResults] = useState<ShareSnapshot["pingResults"]>(
    {},
  );
  const [testState, setTestState] = useState<TestState>({ type: "waiting" });
  const [showResults, setShowResults] = useState(false);

  const testController = useRef<AbortController | undefined>(undefined);

  const completeBestTargetIndex =
    testState.type === "complete" ? testState.bestTargetIndex : undefined;
  const completeSelectedTargetIndex =
    testState.type === "complete" ? testState.selectedTargetIndex : undefined;

  const applySnapshot = useCallback((snapshot: ShareSnapshot) => {
    const bestTargetIndex =
      snapshot.bestTargetIndex ?? getBestTargetIndex(snapshot.pingResults);

    setPingResults(snapshot.pingResults);

    if (bestTargetIndex === undefined) {
      setTestState({ type: "all-failed" });
      setShowResults(false);
      return;
    }

    setTestState({
      type: "complete",
      bestTargetIndex,
      selectedTargetIndex: normalizeSelectedTargetIndex(
        snapshot.pingResults,
        snapshot.selectedTargetIndex,
      ),
    });
    setShowResults(true);
  }, []);

  useEffect(() => {
    setMode((currentMode): Mode => {
      if (displayLocation === undefined) {
        return currentMode;
      }

      if (testState.type === "waiting") {
        return {
          type: "globe",
          location: displayLocation,
        };
      }

      if (testState.type === "running" && currentMode.type === "ping-region") {
        return {
          ...currentMode,
          location: displayLocation,
        };
      }

      if (testState.type === "all-failed") {
        return {
          type: "globe",
          location: displayLocation,
        };
      }

      if (testState.type === "complete") {
        const bestSummary =
          completeBestTargetIndex === undefined
            ? undefined
            : pingResults[pingTargets[completeBestTargetIndex]?.id];

        if (completeSelectedTargetIndex === undefined) {
          if (!bestSummary) {
            return currentMode;
          }

          return {
            type: "globe",
            location: displayLocation,
            highlightedDcd: bestSummary.dc_id,
          };
        }

        const selectedSummary =
          pingResults[pingTargets[completeSelectedTargetIndex]?.id];
        if (!selectedSummary) {
          return currentMode;
        }

        return {
          type: "dc-focus",
          dcId: selectedSummary.dc_id,
        };
      }

      return currentMode;
    });
  }, [
    completeBestTargetIndex,
    completeSelectedTargetIndex,
    displayLocation,
    pingResults,
    testState.type,
  ]);

  const resetToWaiting = useCallback(() => {
    if (testController.current) {
      testController.current.abort();
    }

    setTestState({ type: "waiting" });
    setShowResults(false);
  }, []);

  const startTest = useCallback(
    async (onlyIfWaiting?: boolean) => {
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

      onBeforeStart?.();
      setShowResults(false);

      const signal = testController.current.signal;
      let bestIndex = 0;
      let bestLatency = 0;

      for (let i = 0; i < pingTargets.length; ++i) {
        const targetDetails = pingTargets[i];
        setTestState({
          type: "running",
          currentTargetIndex: i,
        });

        setPingResults((results) => {
          const copy = { ...results };
          delete copy[targetDetails.id];
          return copy;
        });

        let modeSet = false;

        const result = await testPings(targetDetails.target, {
          signal,
          onUpdate: (summary) => {
            if (!modeSet) {
              modeSet = true;
              setMode({
                type: "ping-region",
                location,
                target: { dc_id: summary.dc_id, region: summary.region },
              });
            }

            setPingResults((results) => ({
              [targetDetails.id]: summary,
              ...results,
            }));
          },
        });

        setPingResults((results) => ({
          [targetDetails.id]: result,
          ...results,
        }));

        if (!result.error) {
          if (bestLatency === 0 || result.latencyAvg < bestLatency) {
            bestIndex = i;
            bestLatency = result.latencyAvg;
          }
        }
      }

      if (bestLatency === 0) {
        setTestState({ type: "all-failed" });
      } else {
        setTestState({
          type: "complete",
          selectedTargetIndex: undefined,
          bestTargetIndex: bestIndex,
        });

        setShowResults(true);
      }
    },
    [onBeforeStart, userLocation],
  );

  useEffect(() => {
    if (!autoStart || !userLocation) {
      return;
    }

    const tid = setTimeout(() => {
      void startTest(true);
    }, 100);

    return () => clearTimeout(tid);
  }, [autoStart, startTest, userLocation]);

  const toggleSelectedTarget = useCallback((index: number) => {
    setTestState((state): TestState => {
      if (state.type !== "complete") {
        return state;
      }

      if (state.selectedTargetIndex === index) {
        return {
          type: "complete",
          selectedTargetIndex: undefined,
          bestTargetIndex: state.bestTargetIndex,
        };
      }

      return {
        type: "complete",
        selectedTargetIndex: index,
        bestTargetIndex: state.bestTargetIndex,
      };
    });
  }, []);

  return {
    mode,
    pingResults,
    testState,
    showResults,
    setShowResults,
    startTest,
    stopTest: resetToWaiting,
    dismissAllFailed: resetToWaiting,
    toggleSelectedTarget,
    applySnapshot,
  };
}
