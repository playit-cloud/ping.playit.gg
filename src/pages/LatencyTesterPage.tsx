import { useEffect } from "react";
import AllTestsFailedModal from "@/components/AllTestsFailedModal";
import PingExperienceLayout from "@/components/PingExperienceLayout";
import TestResultsModal from "@/components/TestResultsModal";
import { usePingSession } from "@/shared/usePingSession";
import { useShareLinkState } from "@/shared/useShareLinkState";
import { useUserLocation } from "@/shared/useUserLocation";

export default function LatencyTesterPage() {
  const { userLocation, error } = useUserLocation();
  const pingSession = usePingSession({
    userLocation,
    displayLocation: userLocation,
    autoStart: true,
  });

  const sharing = useShareLinkState({
    getPayload: () => {
      if (pingSession.testState.type !== "complete") return null;
      const firstResult = Object.values(pingSession.pingResults)[0];
      return {
        clientIp: firstResult?.clientIp,
        pingResults: pingSession.pingResults,
        bestTargetIndex: pingSession.testState.bestTargetIndex,
        selectedTargetIndex: pingSession.testState.selectedTargetIndex,
        userLocation,
      };
    },
  });

  useEffect(() => {
    if (error) {
      alert(error);
    }
  }, [error]);

  return (
    <>
      {pingSession.showResults && (
        <TestResultsModal
          onClose={() => pingSession.setShowResults(false)}
          pingResults={pingSession.pingResults}
          onShare={sharing.handleShare}
          shareState={sharing.shareState}
        />
      )}

      {pingSession.testState.type === "all-failed" && (
        <AllTestsFailedModal
          onClose={pingSession.dismissAllFailed}
          onRetry={() => void pingSession.startTest()}
        />
      )}

      <PingExperienceLayout
        actions={
          <>
            {pingSession.testState.type === "running" ? (
              <button
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 border-2 border-red-400 text-white font-pixel text-[10px] uppercase tracking-wide cursor-pointer"
                onClick={pingSession.stopTest}
              >
                [X] STOP
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 border-2 border-orange-400 text-white font-pixel text-[10px] uppercase tracking-wide cursor-pointer"
                onClick={() => void pingSession.startTest()}
              >
                [▶] RUN TEST
              </button>
            )}
            {pingSession.testState.type === "complete" && (
              <button
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-700 hover:bg-cyan-600 border-2 border-cyan-400 text-white font-pixel text-[10px] uppercase tracking-wide cursor-pointer"
                onClick={() => pingSession.setShowResults(true)}
              >
                [◆] RESULTS
              </button>
            )}
          </>
        }
        mode={pingSession.mode}
        pingResults={pingSession.pingResults}
        testState={pingSession.testState}
        shareState={sharing.shareState}
        onSelectTarget={pingSession.toggleSelectedTarget}
      />
    </>
  );
}
