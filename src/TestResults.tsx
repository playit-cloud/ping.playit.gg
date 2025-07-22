import type { PingSummary } from "./ping_tester";

type Props = {
    onClose?: () => void;
    pingResults: {[id: string]: PingSummary};
}

export default function TestResults({ onClose, pingResults }: Props) {
    const values = Object.values(pingResults);
    const bestLatency = Math.min(...values.map(v => v.latencyAvg));

    const gl = pingResults["gl4"];
    const best = values.find(v => v.latencyAvg === bestLatency);

    if (!best) {
        throw new Error('cannot find best DC');
    }

    const bestIsGl = pingResults["gl4"] === best;
    const glSameDc = gl.dc_id == best?.dc_id;

    const playitLink = <a href="https://playit.gg" target="_blank">playit.gg</a>;

    let message = null;
    if (glSameDc || bestIsGl) {
        message = (
            <>
            <p>
                Connecting to our free Global Ancast IP, you're ISP is routing you to <strong>"{gl.region}"</strong> with <strong>~{Math.round(gl.latencyAvg)}ms</strong> of latency. More specifically our <strong>{gl.dc}</strong> datacenter.
            </p>
            <p className="note">
                When connecting to a game server made public by {playitLink}, your connection will not 
                be faster if the host is using playit premium with a regional tunnel. Routing can be different for other 
                users / players. If a player has bad latency in game, <a target="_blank" href="https://ping.playit.gg">have them run this latency test</a>.
            </p>
            <p>
                If you were connecting to your own server make public through {playitLink}, you can expect <strong>~{Math.round(gl.latencyAvg + best.latencyAvg)}ms</strong> of latency in game.
            </p>
            </>
        );
    } else {
        const scale = (Math.round((gl.latencyAvg / best.latencyAvg) * 100.0) / 100.0).toFixed(2);
        const glInGame = gl.latencyAvg + best.latencyAvg;
        const bestInGame = best.latencyAvg * 2;
        const inGameScale = (Math.round((glInGame / bestInGame) * 100.0) / 100.0).toFixed(2);

        message = (
            <>
            <p>
                Connecting to our free Global Ancast IP, you're ISP is routing you to <strong>"{gl.region}"</strong> (with our <strong>{gl.dc}</strong> datacenter) at <strong>~{Math.round(gl.latencyAvg)}ms</strong> of latency.
            </p>

            <p>
                Using our <strong>"{best.region}"</strong> Regional Tunnel your ISP is connecting you to our <strong>{best.dc}</strong> datacenter with <strong>~{Math.round(best.latencyAvg)}ms</strong> of latency.
            </p>
            <p className="note orange">
                <a href="https://playit.gg/account/billing/shop/premium" target="_blank">Playit Premium</a> with a <strong>"{best.region}"</strong> Regional Tunnel cuts off <strong>~{Math.round(gl.latencyAvg - best.latencyAvg)}ms</strong> of latency (<strong>{scale}x</strong> faster). Where the server is hosted will also have an affect, <a target="_blank" href="https://playit.gg/support/how-to-lower-ping/">read this</a> for more details.
            </p>
            <p>
                If you were connecting to your own server made public through {playitLink}, here's what you can expect:
                <br/><br/>
                <strong>With Global Ancast (free):</strong>
                <br/>
                <strong>~{Math.round(glInGame)}ms</strong> of latency in game.
                <br/>
                <br/>
                <strong>With "{best.region}" Regional Tunnel (playit premium):</strong>
                <br/>
                <strong>~{Math.round(bestInGame)}ms</strong> of latency in game.
                <br/><br/>That's <strong>{inGameScale}x</strong> less latency.
            </p>
            </>
        );
    }

    return (
        <div className="test-results" onClick={onClose}>
            <div className="inner" onClick={evt => evt.stopPropagation()} onScroll={evt => evt.stopPropagation()}>
                <h1>Ping Results</h1>
                {message}
                <button className="close" onClick={onClose}>close</button>
            </div>
        </div>
    );
}