import type { ReactNode } from "react";
import playitLogo from "@/images/playit-logo.png";

type Props = {
  actions: ReactNode;
  mapContent: ReactNode;
  sidebarContent: ReactNode;
};

export default function AppShell({
  actions,
  mapContent,
  sidebarContent,
}: Props) {
  return (
    <div
      className="text-gray-100 min-h-screen"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <header
        className="px-4 md:px-6 h-14 flex items-center justify-between border-b-2 border-orange-500 sticky top-0 z-10"
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div className="flex items-center gap-4">
          <a href="https://playit.gg" className="flex items-center no-underline">
            <img src={playitLogo} alt="playit.gg" className="h-9" />
          </a>
          <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-500">
            <span className="text-orange-500">&gt;</span>
            <span className="text-cyan-400 font-pixel text-xs">
              LATENCY_TESTER
            </span>
            <span className="animate-pulse">_</span>
          </div>
        </div>

        <div className="flex items-center gap-3">{actions}</div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)]">
        {mapContent}
        {sidebarContent}
      </div>
    </div>
  );
}
