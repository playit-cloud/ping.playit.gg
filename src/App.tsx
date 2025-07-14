import { useState } from 'react';
import './App.css'
import MapChart from './MapChart';

import datacenters from "./datacenters.json"

function App() {
  const location: [number, number] = [-122.4194, 37.7749];
  const [sourceDcId, setSourceDcId] = useState(19); // Example data center ID
  const [targetDcId, setTargetDcId] = useState(43); // Example data center ID

  return (
    <div>
      <div>
        <strong>FROM</strong>
      </div>
      <div>
      {
        datacenters.map(dc => (
          <button key={dc.id} onClick={() => setSourceDcId(dc.id)}>
            {dc.name}
          </button>
        ))
      }
      </div>
      <div>
        <strong>TO</strong>
      </div>
      <div>
      {
        datacenters.map(dc => (
          <button key={dc.id} onClick={() => setTargetDcId(dc.id)}>
            {dc.name}
          </button>
        ))
      }
      </div>
      <MapChart mode={{type: "ping-between", region: "north-america", targetDcId, sourceDcId }} />
    </div>
  );
}


export default App;
