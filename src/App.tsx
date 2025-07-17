import { useEffect, useState } from 'react';
import './index.css'
import MapChart, { type Mode } from './MapChart';

import { testPing, testPings } from './ping_tester';

const pingTargets = [
    {
      id: "gl4",
      name: "Global Anycast (free)",
      target: "//gl4.rt.playit.gg",
    },
    {
      id: "na4",
      name: "North America (premium)",
      target: "//na4.rt.playit.gg",
    },
    {
      id: "eu4",
      name: "Europe (premium)",
      target: "//eu4.rt.playit.gg",
    },
    {
      id: "as4",
      name: "Asia (premium)",
      target: "//as4.rt.playit.gg",
    },
    {
      id: "sa4",
      name: "South America (premium)",
      target: "//sa4.rt.playit.gg",
    },
    {
      id: "in4",
      name: "India (premium)",
      target: "//in4.rt.playit.gg",
    },
  ];


function App() {
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>(undefined);
  const [mode, setMode] = useState<Mode>({ type: "globe", location: userLocation || [0, 0] });

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      const res = await fetch('https://ipv4-check-perf.radar.cloudflare.com/api/info', { signal });
      const json = await res.json();
      if (typeof json.latitude === "string" && typeof json.longitude === "string") {
        setUserLocation([+json.longitude, +json.latitude]);
      } else {
        console.log("Cloudflare Response: ", json);
        alert("failed to get your location details from Cloudflare");
      }
    })();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    setMode((mode: Mode): Mode => {
      if (mode.type !== "ping-between" && userLocation != undefined) {
        return {
          ...mode,
          location: userLocation,
        };
      }
      return mode;
    });
  }, [userLocation && userLocation[0] || 0, userLocation && userLocation[1] || 0]);
  

  useEffect(() => {
    (async () => {
      return;
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));

    let target = await testPing("//gl4.rt.playit.gg");
    setMode({ type: "ping-region", location: userLocation, target });
    const globalResults = await testPings("//gl4.rt.playit.gg");
    console.log("Global results:", globalResults);

    target = await testPing("//eu4.rt.playit.gg");
    setMode({ type: "ping-region", location: userLocation, target });
    const europeResults = await testPings("//eu4.rt.playit.gg");
    console.log("Europe results:", europeResults);

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    target = await testPing("//as4.rt.playit.gg");
    setMode({ type: "ping-region", location: userLocation, target });
    const asiaResults = await testPings("//as4.rt.playit.gg");
    console.log("Asia results:", asiaResults);

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    target = await testPing("//in4.rt.playit.gg");
    setMode({ type: "ping-region", location: userLocation, target });
    const indiaResults = await testPings("//in4.rt.playit.gg");
    console.log("India results:", indiaResults);

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    target = await testPing("//sa4.rt.playit.gg");
    setMode({ type: "ping-region", location: userLocation, target });
    const southAmericaResults = await testPings("//sa4.rt.playit.gg");
    console.log("South America results:", southAmericaResults);

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    target = await testPing("//na4.rt.playit.gg");
    setMode({ type: "ping-region", location: userLocation, target });
    const northAmericaResults = await testPings("//na4.rt.playit.gg");
    console.log("North America results:", northAmericaResults);

    // const res = await testPings("//255.ip.ply.gg/index.json");
    // console.log(res);
    })();
  }, []);

  return (
    <div>
      <div className="header">
        <a href="https://playit.gg">Playit.gg</a> Latency Tool
        <div className="grow" />
        <button>Start Test</button>
      </div>
      <div className="content">
        <div className="body">
        <MapChart mode={mode} />
        </div>
        <div className="details">
          {
            pingTargets.map(target => (
              <div key={target.id} className={"region " + (target.id === "na4" ? "active" : "")}>
                <div className="title">{target.name}</div>
                <div className="data">
                  <div className="attribute">
                    <span>Datacenter: </span> ?
                  </div>
                  <div className="attribute">
                    <span>Average Latency: </span> ?
                  </div>
                  <div className="attribute">
                    <span>Latency Range (High/Low): </span> ?
                  </div>
                  <div className="attribute">
                    <span>Latency Jitter: </span> ?
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

export default App;
