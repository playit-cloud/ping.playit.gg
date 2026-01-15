import type { PingSummary } from "./ping_tester";

type Props = {
  onClose?: () => void;
  pingResults: { [id: string]: PingSummary };
};

export default function TestResults({ onClose, pingResults }: Props) {
  const values = Object.values(pingResults);
  const bestLatency = Math.min(...values.map((v) => v.latencyAvg));

  const gl = pingResults["GlobalAnycast"];
  const best = values.find((v) => v.latencyAvg === bestLatency);

  if (!best) {
    throw new Error("cannot find best DC");
  }

  const bestIsGl = pingResults["GlobalAnycast"] === best;
  const glSameDc = gl.dc_id == best?.dc_id;

  const playitLink = (
    <a href="https://playit.gg" target="_blank">
      playit.gg
    </a>
  );

  const noteClasses = "ml-2.5 border-l-2 border-neutral-900 bg-neutral-900 p-2.5";
  const noteOrangeClasses =
    "ml-2.5 border-l-2 border-orange-600 bg-amber-950 p-2.5";

  let message = null;
  if (glSameDc || bestIsGl) {
    message = (
      <>
        <p>
          Connecting to our free Global Anycast IP, your ISP is routing you to{" "}
          <strong>"{gl.region}"</strong> with{" "}
          <strong>~{Math.round(gl.latencyAvg)}ms</strong> of latency. More
          specifically our <strong>{gl.dc}</strong> datacenter.
        </p>
        <p className={noteClasses}>
          When connecting to a game server made public by {playitLink}, your
          connection will not be faster if the host is using playit premium with
          a regional tunnel. Routing can be different for other users / players.
          If a player has bad latency in game,{" "}
          <a target="_blank" href="https://ping.playit.gg">
            have them run this latency test
          </a>
          .
        </p>
        <p>
          If you were connecting to your own server made public through{" "}
          {playitLink}, you can expect{" "}
          <strong>~{Math.round(gl.latencyAvg + best.latencyAvg)}ms</strong> of
          latency in game.
        </p>
      </>
    );
  } else {
    const scale = (
      Math.round((gl.latencyAvg / best.latencyAvg) * 100.0) / 100.0
    ).toFixed(2);
    const glInGame = gl.latencyAvg + best.latencyAvg;
    const bestInGame = best.latencyAvg * 2;
    const inGameScale = (
      Math.round((glInGame / bestInGame) * 100.0) / 100.0
    ).toFixed(2);

    message = (
      <>
        <p>
          Connecting to our free Global Anycast IP, your ISP is routing you to{" "}
          <strong>"{gl.region}"</strong> (with our <strong>{gl.dc}</strong>{" "}
          datacenter) at <strong>~{Math.round(gl.latencyAvg)}ms</strong> of
          latency.
        </p>

        <p>
          Using our <strong>"{best.region}"</strong> Regional Tunnel your ISP is
          connecting you to our <strong>{best.dc}</strong> datacenter with{" "}
          <strong>~{Math.round(best.latencyAvg)}ms</strong> of latency.
        </p>
        <p className={noteOrangeClasses}>
          <a
            href="https://playit.gg/account/billing/shop/premium"
            target="_blank"
          >
            Playit Premium
          </a>{" "}
          with a <strong>"{best.region}"</strong> Regional Tunnel cuts off{" "}
          <strong>~{Math.round(gl.latencyAvg - best.latencyAvg)}ms</strong> of
          latency (<strong>{scale}x</strong> faster). Where the server is hosted
          will also have an affect on your in game latency,{" "}
          <a
            target="_blank"
            href="https://playit.gg/support/how-to-lower-ping/"
          >
            read this
          </a>{" "}
          for more details.
        </p>
        <p>
          If you were connecting to your own server made public through{" "}
          {playitLink}, here's what you can expect:
          <br />
          <br />
          <strong>With Global Anycast (free):</strong>
          <br />
          <strong>~{Math.round(glInGame)}ms</strong> of latency in game.
          <br />
          <br />
          <strong>
            With "{best.region}" Regional Tunnel (playit premium):
          </strong>
          <br />
          <strong>~{Math.round(bestInGame)}ms</strong> of latency in game.
          <br />
          <br />
          That's <strong>{inGameScale}x</strong> less latency.
        </p>
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-white/40 z-50 flex flex-col items-center justify-center overflow-x-hidden p-5 box-border cursor-pointer h-screen"
      onClick={onClose}
    >
      <div
        className="w-[800px] bg-neutral-800 max-w-full p-2.5 box-border border-4 border-black cursor-auto max-h-screen overflow-y-auto"
        onClick={(evt) => evt.stopPropagation()}
        onScroll={(evt) => evt.stopPropagation()}
      >
        <h1 className="m-0 text-lg">Ping Results</h1>
        {message}
        <button
          className="px-3 py-0.5 bg-neutral-900 text-white font-bold rounded-sm border-2 border-black cursor-pointer text-sm hover:border-white"
          onClick={onClose}
        >
          close
        </button>
      </div>
    </div>
  );
}
