import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Line,
  Sphere,
  type ProjectionConfig
} from "react-simple-maps";

import { darken, lighten, mix } from "polished";

import datacenters from "./datacenters.json";
import { useEffect, useState } from "react";

const geoUrl = "/features.json";

function lerpProjectionConfig(configA: ProjectionConfig, configB: ProjectionConfig, t: number): ProjectionConfig {
  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  if (typeof configA.rotate === "number") {
    configA.rotate = [configA.rotate, configA.rotate, configA.rotate];
  } else if (typeof configA.rotate === "undefined") {
    configA.rotate = [0, 0, 0];
  }

  if (typeof configB.rotate === "number") {
    configB.rotate = [configB.rotate, configB.rotate, configB.rotate];
  } else if (typeof configB.rotate === "undefined") {
    configB.rotate = [0, 0, 0];
  }

  if (typeof configA.center === "undefined") {
    configA.center = [0, 0];
  }

  if (typeof configB.center === "undefined") {
    configB.center = [0, 0];
  }

  if (typeof configA.scale === "undefined") {
    configA.scale = 1;
  }

  if (typeof configB.scale === "undefined") {
    configB.scale = 1;
  }

  return {
    rotate: [
      lerp(configA.rotate[0], configB.rotate[0], t),
      lerp(configA.rotate[1], configB.rotate[1], t),
      lerp(configA.rotate[2], configB.rotate[2], t),
    ],
    center: [
      lerp(configA.center[0], configB.center[0], t),
      lerp(configA.center[1], configB.center[1], t),
    ],
    scale: lerp(configA.scale, configB.scale, t),
  };
}

// Utility to generate a projection config that ensures two GPS points are within view
// Accepts two [lon, lat] points and returns a projectionConfig for geoAzimuthalEqualArea
function getProjectionConfigForPoints(pointA: [number, number], pointB: [number, number]): ProjectionConfig {
  // Calculate the midpoint
  const midLon = (pointA[0] + pointB[0]) / 2;
  const midLat = (pointA[1] + pointB[1]) / 2;

  // Calculate the distance between the points (roughly, in degrees)
  const dLon = Math.abs(pointA[0] - pointB[0]);
  const dLat = Math.abs(pointA[1] - pointB[1]);
  // Use the larger of the two for scale calculation
  const maxSpan = Math.max(dLon, dLat);

  // Heuristic: scale inversely proportional to the span, with a base scale
  // These numbers may need tuning for your map size and projection
  const baseScale = 1100;
  const scale = Math.max(300, baseScale * (60 / (maxSpan + 1))) * 0.3;

  // To keep the equator horizontal, set the second value of rotate (latitude) to 0
  // Set center to the midpoint to ensure both points are centered
  return {
    rotate: [-midLon, 0, 0],
    center: [0, midLat],
    scale,
  };
}

// List of European country geo IDs (ISO A3 codes)
const europeGeoIds = [
  "ALB", // Albania
  "AND", // Andorra
  "AUT", // Austria
  "BLR", // Belarus
  "BEL", // Belgium
  "BIH", // Bosnia and Herzegovina
  "BGR", // Bulgaria
  "HRV", // Croatia
  "CYP", // Cyprus
  "CZE", // Czechia
  "DNK", // Denmark
  "EST", // Estonia
  "FIN", // Finland
  "FRA", // France
  "DEU", // Germany
  "GRC", // Greece
  "HUN", // Hungary
  "IRL", // Ireland
  "ITA", // Italy
  "LVA", // Latvia
  "LIE", // Liechtenstein
  "LTU", // Lithuania
  "LUX", // Luxembourg
  "MLT", // Malta
  "MDA", // Moldova
  "MCO", // Monaco
  "MNE", // Montenegro
  "NLD", // Netherlands
  "MKD", // North Macedonia
  "NOR", // Norway
  "POL", // Poland
  "PRT", // Portugal
  "ROU", // Romania
  "SMR", // San Marino
  "SRB", // Serbia
  "SVK", // Slovakia
  "SVN", // Slovenia
  "ESP", // Spain
  "SWE", // Sweden
  "CHE", // Switzerland
  "UKR", // Ukraine
  "GBR", // United Kingdom
  "VAT"  // Vatican City
];

// North America geo IDs
const northAmericaGeoIds = [
  "USA", // United States
  "CAN", // Canada
  "MEX"  // Mexico
];

const latinAmericaGeoIds = [
  //   "DOM", // Dominican Republic
  //   "HND", // Honduras
  //   "NIC", // Nicaragua
  //   "SLV", // El Salvador
  //   "GTM", // Guatemala
  //   "PAN", // Panama
  //   "CRI", // Costa Rica
  //   "CUB", // Cuba

  "ARG", // Argentina
  "BOL", // Bolivia
  "BRA", // Brazil
  "CHL", // Chile
  "COL", // Colombia
  "ECU", // Ecuador
  "PRY", // Paraguay
  "PER", // Peru
  "URY", // Uruguay
  "VEN", // Venezuela
  "GUY", // Guyana
  "SUR", // Suriname
  "GUF", // French Guiana
];

const indiaGeoIds = [
  "IND", // India
  "BGD", // Bangladesh
];

const asiaGeoIds = [
  "JPN", // Japan
  "KOR", // South Korea
  "AUS", // Australia
  "NZL", // New Zealand
  "IDN", // Indonesia
  "PHL", // Philippines
  "THA", // Thailand
  "VNM", // Vietnam
  "MYS", // Malaysia
  "SGP", // Singapore
  "PNG", // Papua New Guinea
];

const orangeColor = '#FF8329';
const blueColor = '#308DFC';
const grayColor = '#899aa8';
const darkColor = '#212a33';
const greenColor = '#0db97a';
const redColor = '#D24A3B';

const regionColors: Record<string, string> = {
  europe: blueColor,
  "north-america": orangeColor,
  "south-america": redColor,
  india: grayColor,
  asia: greenColor,
};

export type Mode = {
  type: "globe",
  location: [number, number],
} | {
  type: "ping-global",
  location: [number, number],
  targetDcId: number | undefined,
  latency: number,
} | {
  type: "ping-region",
  region: "europe" | "north-america" | "south-america" | "india" | "asia",
  location: [number, number],
  targetDcId: number | undefined,
} | {
  type: "ping-between"
  sourceDcId: number
  targetDcId: number
};

const MapChart = ({ mode }: { mode: Mode }) => {

  const sourceDcId = (mode.type === "ping-between") ?
    datacenters.find(dc => dc.id === mode.sourceDcId) : datacenters.find(dc => dc.id === 42);

  const targetDc = (mode.type === "ping-region" || mode.type === "ping-between") ?
    datacenters.find(dc => dc.id === mode.targetDcId) : undefined;

  const points = [
    (sourceDcId?.location || [0, 0]) as [number, number],
    (targetDc?.location || [0, 0]) as [number, number],
  ];

  const targetProjection = mode.type === "globe" ? undefined : getProjectionConfigForPoints(points[0], points[1]);

  const [projectionStart, setProjectionStart] = useState<ProjectionConfig | undefined>(undefined);
  const [projection, setProjection] = useState<ProjectionConfig | undefined>(undefined);

  useEffect(() => {
    if (!targetProjection) {
      setProjectionStart(undefined);
      setProjection(undefined);
      return;
    }

    if (!projection) {
      setProjectionStart(targetProjection);
      setProjection(targetProjection);
      return;
    }

    setProjectionStart(projection);

    const stepSize = 0.25;

    let t = stepSize;
    const newProjection = lerpProjectionConfig(projection, targetProjection, t);
    setProjection(newProjection);

    let tid: number;

    function updateAnimation() {
      if (!projectionStart || !targetProjection) return;

      t = Math.min(1.0, t + stepSize);
      setProjection(lerpProjectionConfig(projectionStart, targetProjection, t));
      if (t < 1) {
        tid = setTimeout(updateAnimation, 10);
      }
    }

    tid = setTimeout(updateAnimation, 10);
    return () => clearTimeout(tid);
  }, [targetProjection]);

  return (
    <ComposableMap
      projection={mode.type === "globe" ? "geoEqualEarth" : "geoConicEquidistant"}
      projectionConfig={projection}
    >
      <Geographies geography={geoUrl} stroke={darken(0.2, orangeColor)} strokeWidth={0.5}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const europe = europeGeoIds.indexOf(geo.id) !== -1;
            const northAmerica = northAmericaGeoIds.indexOf(geo.id) !== -1;
            const latinAmerica = latinAmericaGeoIds.indexOf(geo.id) !== -1;
            const india = indiaGeoIds.indexOf(geo.id) !== -1;
            const asia = asiaGeoIds.indexOf(geo.id) !== -1;

            let region;
            if (europe) {
              region = "europe";
            } else if (northAmerica) {
              region = "north-america";
            } else if (latinAmerica) {
              region = "south-america";
            } else if (india) {
              region = "india";
            } else if (asia) {
              region = "asia";
            }

            let color = "url('#lines')";
            if (region) {
              color = region ? regionColors[region] : "url('#lines')";
              if (mode.type === "ping-region" && mode.region !== region) {
                color = mix(0.5, color, darkColor);
              }
            }

            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={color}
                onClick={() => console.log(geo.properties.name)}
              />
            );
          })
        }
      </Geographies>
      <Line coordinates={points} stroke="#F53" strokeWidth={2} />
      <Geographies geography={geoUrl}>
        {({ projection }) => (
          <g>
            {datacenters.map((dc) => {
              const projected = projection(dc.location as [number, number]);
              if (!projected) return null;

              let color;
              if (dc.region === "europe") {
                color = blueColor;
              } else if (dc.region === "north-america") {
                color = orangeColor;
              } else if (dc.region === "south-america") {
                color = redColor;
              } else if (dc.region === "india") {
                color = grayColor;
              } else if (dc.region === "asia") {
                color = greenColor;
              } else {
                color = darkColor; // Default color for other regions
              }

              const [cx, cy] = projected;
              return (
                <circle
                  key={dc.name}
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={darken(0.2, color)}
                  stroke={lighten(0.3, color)}
                  strokeWidth={1.5}
                >
                  <title>{dc.name}</title>
                </circle>
              );
            })}
          </g>
        )}
      </Geographies>
    </ComposableMap>
  );
};

export default MapChart;
