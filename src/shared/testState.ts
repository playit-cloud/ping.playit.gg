import type { PingResults } from "@/shared/shareTypes";
import pingTargets from "@/shared/pingTargets";

export type TestState =
  | { type: "waiting" }
  | { type: "running"; currentTargetIndex: number }
  | {
      type: "complete";
      bestTargetIndex: number;
      selectedTargetIndex: number | undefined;
    }
  | { type: "all-failed" };

export const getBestTargetIndex = (results: PingResults) => {
  let bestTargetIndex: number | undefined;
  let bestLatency = Number.POSITIVE_INFINITY;

  pingTargets.forEach((target, index) => {
    const summary = results[target.id];
    if (!summary || summary.error) {
      return;
    }

    if (summary.latencyAvg < bestLatency) {
      bestLatency = summary.latencyAvg;
      bestTargetIndex = index;
    }
  });

  return bestTargetIndex;
};

export const normalizeSelectedTargetIndex = (
  results: PingResults,
  selectedTargetIndex: number | undefined,
) => {
  if (selectedTargetIndex === undefined) {
    return undefined;
  }

  const target = pingTargets[selectedTargetIndex];
  return target && results[target.id] ? selectedTargetIndex : undefined;
};
