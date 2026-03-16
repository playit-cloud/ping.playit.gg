import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import MapPanel from "@/components/MapPanel";
import ServerRegionsSidebar from "@/components/ServerRegionsSidebar";
import type { Mode } from "@/components/MapChart";
import type { ShareState } from "@/shared/shareState";
import type { PingResults } from "@/shared/shareTypes";
import type { TestState } from "@/shared/testState";

type Props = {
  actions: ReactNode;
  mode: Mode;
  pingResults: PingResults;
  testState: TestState;
  isViewingSharedResult?: boolean;
  shareState?: ShareState;
  loadingSharedSnapshot?: boolean;
  sharedSnapshotError?: string;
  onSelectTarget: (index: number) => void;
};

export default function PingExperienceLayout({
  actions,
  mode,
  pingResults,
  testState,
  isViewingSharedResult = false,
  shareState,
  loadingSharedSnapshot = false,
  sharedSnapshotError,
  onSelectTarget,
}: Props) {
  return (
    <AppShell
      actions={actions}
      mapContent={
        <MapPanel
          mode={mode}
          testState={testState}
          loadingSharedSnapshot={loadingSharedSnapshot}
          sharedSnapshotError={sharedSnapshotError}
        />
      }
      sidebarContent={
        <ServerRegionsSidebar
          pingResults={pingResults}
          testState={testState}
          isViewingSharedResult={isViewingSharedResult}
          sharedUrl={shareState?.status === "ready" ? shareState.url : undefined}
          onSelectTarget={onSelectTarget}
        />
      }
    />
  );
}
