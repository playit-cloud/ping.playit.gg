import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Line,
  Marker,
  type ProjectionConfig
} from "react-simple-maps";

import { darken, lighten, mix } from "polished";

import datacenters from "./datacenters.json";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PingResult } from "./ping_tester";

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
const grayColor = 'rgb(207, 41, 226)';
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
  highlightedDcd?: number;
} | {
  type: "ping-region",
  location: [number, number],
  target: { dc_id: number; region: string; },
} | {
  type: "ping-between"
  sourceDcId: number
  targetDcId: number
} | {
  type: "dc-focus",
  dcId: number,
};

function easeInOutCirc(x: number): number {
return x < 0.5
  ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
  : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

const MapChart = ({ mode }: { mode: Mode }) => {
  let points = [
    [0, 0] as [number, number],
    [0, 0] as [number, number],
  ];

  if (mode.type === "ping-region") {
    points[0][0] = mode.location[0];
    points[0][1] = mode.location[1];

    const dc = datacenters.find((dc) => dc.id === mode.target.dc_id);
    if (dc) {
      points[1][0] = dc.location[0];
      points[1][1] = dc.location[1];
    }
  }

  const targetProjection = useMemo(() => {
    let singleGps: [number, number] | undefined = undefined;

    if (mode.type === "globe") {
      if (mode.highlightedDcd) {
        const dc = datacenters.find(d => d.id === mode.highlightedDcd);
        if (dc) {
          return getProjectionConfigForPoints(
            [mode.location[0], mode.location[1]],
            dc.location as [number, number],
          );
        }
      }
      singleGps = [mode.location[0], mode.location[1]];
    }
    else if (mode.type === "dc-focus") {
      const dc = datacenters.find(dc => dc.id === mode.dcId);
      singleGps = dc?.location as [number, number] | undefined;
    }

    if (singleGps) {
      return {
        rotate: [0.0 - singleGps[0], 0.0, 0.0],
        center: [0, singleGps[1]],
        scale: 1100 * 0.5, // Adjust scale for globe view
      } as ProjectionConfig;
    }

    return getProjectionConfigForPoints(points[0], points[1]);
  }, [
    mode.type,
    points[0][0],
    points[0][1],
    points[1][0],
    points[1][1],
    mode.type === "globe" && mode.location[0],
    mode.type === "globe" && mode.location[1],
    mode.type === "globe" && mode.highlightedDcd,
    mode.type === "dc-focus" && mode.dcId
  ]);

  const projectionStartRef = useRef<ProjectionConfig | undefined>(undefined);
  const [projection, setProjection] = useState<ProjectionConfig | undefined>(undefined);

  useEffect(() => {
    if (!targetProjection) {
      setProjection(undefined);
      return;
    }

    if (!projection) {
      setProjection(targetProjection);
      return;
    }

    projectionStartRef.current = projection;

    const animationDuration = 0.25;

    let tid: number;
    let start: number | undefined = undefined;

    function updateAnimation(msTime: number) {
      if (!projectionStartRef.current || !targetProjection) return;

      if (start === undefined) {
        start = msTime;
      }

      const elapsed = msTime - start;

      const t = Math.min(1.0, elapsed * 0.001 / animationDuration);
      setProjection(lerpProjectionConfig(projectionStartRef.current, targetProjection, easeInOutCirc(t)));
      if (t < 1) {
        tid = requestAnimationFrame(updateAnimation);
      }
    }

    tid = requestAnimationFrame(updateAnimation);
    return () => cancelAnimationFrame(tid);
  }, [targetProjection]);

  return (
    <ComposableMap
      projection={mode.type === "globe" ? "geoConicEquidistant" : "geoConicEquidistant"}
      projectionConfig={projection}

      width={800}
      height={600}
      style={{backgroundColor: "gray", width: "100%", height: "100%"}}
    >
      <Geographies geography={geoUrl} stroke={darken(0.2, orangeColor)} strokeWidth={0.5}>
        {({ geographies, projection }) => (
          <>
          {
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
                if (mode.type === "ping-region" && mode.target.region !== region) {
                  color = mix(0.1, color, "gray");
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

          { mode.type != "globe" && <Line coordinates={points} stroke="#F53" strokeWidth={2} /> }

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

            let focusId = (mode.type === "globe" && mode.highlightedDcd)
              || (mode.type === "dc-focus" && mode.dcId)
              || undefined;

            let stroke = lighten(0.3, color);
            if (focusId && dc.id !== focusId) {
              color = mix(0.3, color, 'gray');
              stroke = color;
            }

            const [cx, cy] = projected;
            return (
              <circle
                key={dc.name}
                cx={cx}
                cy={cy}
                r={5}
                fill={darken(0.2, color)}
                stroke={stroke}
                strokeWidth={1.5}
              >
                <title>{dc.name}</title>
              </circle>
            );
          })}

          {(mode.type === "globe" || mode.type === "ping-region") && <Marker coordinates={mode.location} fill={darkColor} stroke="#fff" strokeWidth={1}>
            <g
              fill="none"
              stroke="rgba(56, 12, 12, 0.8)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform={`translate(${-12.0 * MARKER_SCALE}, ${-24 * MARKER_SCALE}) scale(${MARKER_SCALE})`}
            >
              <circle cx="12" cy="10" r="3" />
              <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" />
            </g>
          </Marker>}
        </>
      )}
      </Geographies>
    </ComposableMap>
  );
};

const MARKER_SCALE = 4.0;

export default MapChart;
