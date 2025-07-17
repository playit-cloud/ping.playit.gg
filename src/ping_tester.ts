type Output = {
    dc: string;
    dc_id: number;
    region: string;
};

export type PingResult = {
    dc: string;
    dc_id: number;
    region: string;
    latency: number;
    serverIp: string;
    clientIp: string;
};

type PingSummary = {
    dc: string;
    dc_id: number;
    region: string;
    serverIp: string;
    clientIp: string;
    latencyMax: number;
    latencyMin: number;
    latencyAvg: number;
    latencyJitter: number;
    clientIpChanged: boolean
};

export const testPingHead = async (target: string): Promise<number> =>{
    const start = performance.now();
    const response = await fetch(`${target}?s=${start}`, { keepalive: true, cache: 'no-store', method: 'HEAD' });
    const latency = performance.now() - start;

    if (!response.ok) {
        throw new Error(`Ping failed: ${response.statusText}`);
    }
    return latency;
}

export const testPing = async (target: string): Promise<PingResult> =>{
    const start = performance.now();
    const response = await fetch(`${target}?s=${start}`, { keepalive: true, cache: 'no-store' });
    const latency = performance.now() - start;

    if (!response.ok) {
        throw new Error(`Ping failed: ${response.statusText}`);
    }

    const clientIp = response.headers.get("X-Client-Ip") as string;
    const serverIp = response.headers.get("X-Server-Ip") as string;

    console.log("Ping response headers:", response.headers.get("X-Origin"));

    const data: Output = await response.json();
    return {
        dc: data.dc,
        dc_id: data.dc_id,
        region: data.region,
        latency,
        serverIp,
        clientIp,
    };
}

export const testPings = async (target: string): Promise<PingSummary> => {
    const initPingTest = await testPing(target);

    const latencies: number[] = [];

    const testStart = Date.now();
    const maxPings = 100000;
    const minPings = 30;

    for (let i = 0; i < maxPings; i++) {
        latencies.push(await testPingHead(target));
        const age = Date.now() - testStart;
        if (5000 < age && minPings <= latencies.length) {
            break;
        }
        if (15000 < age) {
            break;
        }
    }

    latencies.sort((a, b) => a - b);
    latencies.splice(Math.min(20, latencies.length / 2));

    const latencyMax = Math.max(...latencies);
    const latencyMin = Math.min(...latencies);
    const latencyAvg = latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
    const latencyJitter = Math.sqrt(latencies.reduce((sum, latency) => sum + Math.pow(latency - latencyAvg, 2), 0) / latencies.length);

    return {
        dc: initPingTest.dc,
        dc_id: initPingTest.dc_id,
        region: initPingTest.region,
        serverIp: initPingTest.serverIp,
        clientIp: initPingTest.clientIp,
        latencyMax,
        latencyMin,
        latencyAvg,
        latencyJitter,
        clientIpChanged: (await testPing(target)).clientIp != initPingTest.clientIp,
    };
}