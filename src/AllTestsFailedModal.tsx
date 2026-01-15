import { useEffect } from "react";

type Props = {
  onClose?: () => void;
  onRetry?: () => void;
};

export default function AllTestsFailedModal({ onClose, onRetry }: Props) {
  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer"
      style={{ backgroundColor: "rgba(10, 14, 26, 0.95)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg border-2 border-red-500 cursor-auto max-h-[90vh] overflow-y-auto shadow-2xl shadow-red-500/20"
        style={{ backgroundColor: "var(--bg-secondary)" }}
        onClick={(evt) => evt.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b-2 flex items-center justify-between"
          style={{
            borderColor: "var(--border-primary)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-red-500 text-xl">!</span>
            <div>
              <h1 className="font-pixel text-sm text-white m-0 uppercase tracking-wide">
                CONNECTION FAILED
              </h1>
              <p className="font-mono text-xs mt-1 mb-0 text-zinc-500">
                // all ping tests failed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 hover:bg-red-600 border-2 hover:border-red-400 text-zinc-200 hover:text-white font-pixel text-[10px] cursor-pointer"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-primary)",
            }}
          >
            [ESC]
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Error Message */}
          <div className="bg-red-950/50 border-2 border-red-600 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-red-400 text-2xl">X</span>
              <span className="text-red-300 font-pixel text-[10px] uppercase tracking-wide">
                ALL SERVERS UNREACHABLE
              </span>
            </div>
            <p className="text-zinc-300 font-sans text-sm m-0 leading-relaxed">
              We were unable to reach any of the playit.gg servers. This could
              be due to network issues, firewall restrictions, or temporary
              server unavailability.
            </p>
          </div>

          {/* Troubleshooting */}
          <div
            className="border-2 p-5"
            style={{
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--border-primary)",
            }}
          >
            <div className="font-pixel text-[10px] uppercase tracking-wider mb-4 text-zinc-400">
              <span className="text-orange-500">//</span> TROUBLESHOOTING
            </div>
            <ul className="text-zinc-300 font-sans text-sm space-y-2 m-0 pl-4">
              <li>Check your internet connection</li>
              <li>Disable any VPN or proxy services temporarily</li>
              <li>Check if your firewall is blocking connections</li>
              <li>Try disabling browser extensions that may interfere</li>
              <li>Wait a few minutes and try again</li>
            </ul>
          </div>

          {/* Discord Support */}
          <div
            className="border-2 p-5"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-primary)",
            }}
          >
            <div className="font-pixel text-[10px] uppercase tracking-wider mb-3 text-zinc-400">
              <span className="text-cyan-500">//</span> NEED HELP?
            </div>
            <p className="text-zinc-300 font-sans text-sm m-0 mb-4 leading-relaxed">
              If the problem persists, join our Discord server for support. Our
              community and team can help troubleshoot the issue.
            </p>
            <a
              href="https://discord.gg/AXAbujx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 border-2 border-indigo-400 text-white font-pixel text-[10px] uppercase tracking-wide no-underline"
            >
              [&gt;] JOIN DISCORD
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-500 border-2 border-orange-400 text-white font-pixel text-[10px] uppercase tracking-wide cursor-pointer"
            >
              [R] RETRY TEST
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 border-2 text-zinc-300 hover:text-white font-pixel text-[10px] uppercase tracking-wide cursor-pointer"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-primary)",
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
