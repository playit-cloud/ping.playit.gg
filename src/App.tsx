import { useEffect, useState } from 'react';
import './App.css'
import MapChart, { type Mode } from './MapChart';

import datacenters from "./datacenters.json"
import { testPing, testPings } from './ping_tester';

function App() {
  const userLocation: [number, number] = [-123.08468002677508, 44.0498649452011];

  const [sourceDcId, setSourceDcId] = useState(19);
  const [targetDcId, setTargetDcId] = useState(43);
  const [mode, setMode] = useState<Mode>({ type: "globe", location: userLocation });

  useEffect(() => {
    (async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));

    let target = await testPing("//255.ip.gl.ply.gg");
    setMode({ type: "ping-region", location: userLocation, target });
    const globalResults = await testPings("//255.ip.gl.ply.gg/index.json");
    console.log("Global results:", globalResults);

    target = await testPing("//255.ip.eu.ply.gg");
    setMode({ type: "ping-region", location: userLocation, target });
    const europeResults = await testPings("//255.ip.eu.ply.gg/index.json");
    console.log("Europe results:", europeResults);

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    target = await testPing("//255.ip.as.ply.gg");
    setMode({ type: "ping-region", location: userLocation, target });
    const asiaResults = await testPings("//255.ip.as.ply.gg/index.json");
    console.log("Asia results:", asiaResults);

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    target = await testPing("//255.ip.in.ply.gg");
    setMode({ type: "ping-region", location: userLocation, target });
    const indiaResults = await testPings("//255.ip.in.ply.gg/index.json");
    console.log("India results:", indiaResults);


    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    target = await testPing("//255.ip.sa.ply.gg");
    setMode({ type: "ping-region", location: userLocation, target });
    const southAmericaResults = await testPings("//255.ip.sa.ply.gg/index.json");
    console.log("South America results:", southAmericaResults);

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    target = await testPing("//255.ip.na.ply.gg");
    setMode({ type: "ping-region", location: userLocation, target });
    const northAmericaResults = await testPings("//255.ip.na.ply.gg/index.json");
    console.log("North America results:", northAmericaResults);

    // const res = await testPings("//255.ip.ply.gg/index.json");
    // console.log(res);
    })();
  }, []);

  return (
    <div>
      <MapChart mode={mode} />
    </div>
  );
}


export default App;
