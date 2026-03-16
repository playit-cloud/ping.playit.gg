import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AllTestsFailedModal from "@/components/AllTestsFailedModal";
import PingExperienceLayout from "@/components/PingExperienceLayout";
import TestResultsModal from "@/components/TestResultsModal";
import { usePingSession } from "@/shared/usePingSession";
import { useShareLinkState } from "@/shared/useShareLinkState";
import { useSharedSnapshot } from "@/shared/useSharedSnapshot";
import { useUserLocation } from "@/shared/useUserLocation";

export default function SharedResultsPage() {
  const navigate = useNavigate();
  const { shareId } = useParams<{ shareId: string }>();
  const { userLocation, error } = useUserLocation();
  const hydratedShareIdRef = useRef<string | undefined>(undefined);
  const [sharedUserLocation, setSharedUserLocation] = useState<
    [number, number] | undefined
  >(undefined);
  const [sharedCreatedAt, setSharedCreatedAt] = useState<string | undefined>();

  const pingSession = usePingSession({
    userLocation,
    displayLocation: sharedUserLocation ?? userLocation,
  });
  const sharing = useShareLinkState({
    getPayload: () =>
      pingSession.testState.type === "complete"
        ? {
            pingResults: pingSession.pingResults,
            bestTargetIndex: pingSession.testState.bestTargetIndex,
            selectedTargetIndex: pingSession.testState.selectedTargetIndex,
            userLocation: sharedUserLocation ?? userLocation,
          }
        : null,
  });
  const sharedSnapshot = useSharedSnapshot(shareId);
  const { applySnapshot, setShowResults } = pingSession;
  const { handleShare, markLoadedShare, shareState } = sharing;

  useEffect(() => {
    if (error) {
      alert(error);
    }
  }, [error]);

  useEffect(() => {
    if (
      sharedSnapshot.status !== "ready" ||
      !shareId ||
      hydratedShareIdRef.current === shareId
    ) {
      return;
    }

    setSharedUserLocation(sharedSnapshot.snapshot.userLocation);
    setSharedCreatedAt(sharedSnapshot.snapshot.createdAt);
    applySnapshot(sharedSnapshot.snapshot);
    markLoadedShare(shareId);
    hydratedShareIdRef.current = shareId;
  }, [applySnapshot, markLoadedShare, shareId, sharedSnapshot]);

  return (
    <>
      {pingSession.showResults && (
        <TestResultsModal
          onClose={() => setShowResults(false)}
          pingResults={pingSession.pingResults}
          onShare={handleShare}
          shareState={shareState}
          isSharedView
          sharedCreatedAt={sharedCreatedAt}
        />
      )}

      {pingSession.testState.type === "all-failed" && (
        <AllTestsFailedModal
          onClose={() => navigate("/")}
          onRetry={() => navigate("/")}
        />
      )}

      <PingExperienceLayout
        actions={
          <>
            <button
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 border-2 border-orange-400 text-white font-pixel text-[10px] uppercase tracking-wide cursor-pointer"
              onClick={() => navigate("/")}
            >
              [▶] RUN TEST
            </button>
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
        isViewingSharedResult
        shareState={shareState}
        loadingSharedSnapshot={sharedSnapshot.status === "loading"}
        sharedSnapshotError={
          sharedSnapshot.status === "error" ? sharedSnapshot.message : undefined
        }
        onSelectTarget={pingSession.toggleSelectedTarget}
      />
    </>
  );
}
