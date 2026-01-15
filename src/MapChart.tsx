import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
  type ProjectionConfig,
} from "react-simple-maps";

import { darken, lighten, mix } from "polished";

import datacenters from "./pingDcs";
import { useEffect, useMemo, useRef, useState } from "react";

const geoUrl = "/features.json";

function lerpProjectionConfig(
  configA: ProjectionConfig,
  configB: ProjectionConfig,
  t: number,
): ProjectionConfig {
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
function getProjectionConfigForPoints(
  pointA: [number, number],
  pointB: [number, number],
): ProjectionConfig {
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
  "VAT", // Vatican City
];

// North America geo IDs
const northAmericaGeoIds = [
  "USA", // United States
  "CAN", // Canada
  "MEX", // Mexico
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

// Retro gaming color palette - darker, more saturated
const orangeColor = "#f97316"; // Orange for North America
const blueColor = "#0ea5e9"; // Sky blue for Europe
const magentaColor = "#d946ef"; // Fuchsia for India
const darkColor = "#18181b"; // Zinc-900 for background
const greenColor = "#10b981"; // Emerald for Asia
const redColor = "#ef4444"; // Red for South America

// Muted versions for country fills (darker, less saturated)
const regionColors: Record<string, string> = {
  europe: "#1e3a5f", // Dark blue
  "north-america": "#4a2c17", // Dark orange/brown
  "south-america": "#4a1c1c", // Dark red
  india: "#3d1f4a", // Dark purple
  asia: "#1a3d32", // Dark green
};

// Bright accent colors for borders and highlights
const regionAccentColors: Record<string, string> = {
  europe: blueColor,
  "north-america": orangeColor,
  "south-america": redColor,
  india: magentaColor,
  asia: greenColor,
};

export type Mode =
  | {
      type: "globe";
      location: [number, number];
      highlightedDcd?: number;
    }
  | {
      type: "ping-region";
      location: [number, number];
      target: { dc_id: number; region: string };
    }
  | {
      type: "ping-between";
      sourceDcId: number;
      targetDcId: number;
    }
  | {
      type: "dc-focus";
      dcId: number;
    };

function easeInOutCirc(x: number): number {
  return x < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

const MapChart = ({ mode }: { mode: Mode }) => {
  const points = [[0, 0] as [number, number], [0, 0] as [number, number]];

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
        const dc = datacenters.find((d) => d.id === mode.highlightedDcd);
        if (dc) {
          return getProjectionConfigForPoints(
            [mode.location[0], mode.location[1]],
            dc.location as [number, number],
          );
        }
      }
      singleGps = [mode.location[0], mode.location[1]];
    } else if (mode.type === "dc-focus") {
      const dc = datacenters.find((dc) => dc.id === mode.dcId);
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
    mode.type === "dc-focus" && mode.dcId,
  ]);

  const projectionStartRef = useRef<ProjectionConfig | undefined>(undefined);
  const [projection, setProjection] = useState<ProjectionConfig | undefined>(
    undefined,
  );

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

      const t = Math.min(1.0, (elapsed * 0.001) / animationDuration);
      setProjection(
        lerpProjectionConfig(
          projectionStartRef.current,
          targetProjection,
          easeInOutCirc(t),
        ),
      );
      if (t < 1) {
        tid = requestAnimationFrame(updateAnimation);
      }
    }

    tid = requestAnimationFrame(updateAnimation);
    return () => cancelAnimationFrame(tid);
  }, [targetProjection]);

  // Determine the active region for highlighting
  const activeRegion = mode.type === "ping-region" ? mode.target.region : null;

  return (
    <ComposableMap
      projection="geoConicEquidistant"
      projectionConfig={projection}
      width={800}
      height={600}
      style={{ backgroundColor: "#09090b", width: "100%", height: "100%" }}
    >
      {/* Grid pattern definition for non-region countries */}
      <defs>
        <pattern
          id="grid"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 8 0 L 0 0 0 8"
            fill="none"
            stroke="#27272a"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>

      <Geographies
        geography={geoUrl}
        stroke="#3f3f46"
        strokeWidth={0.5}
      >
        {({ geographies, projection }) => (
          <>
            {geographies.map((geo) => {
              const europe = europeGeoIds.indexOf(geo.id) !== -1;
              const northAmerica = northAmericaGeoIds.indexOf(geo.id) !== -1;
              const latinAmerica = latinAmericaGeoIds.indexOf(geo.id) !== -1;
              const india = indiaGeoIds.indexOf(geo.id) !== -1;
              const asia = asiaGeoIds.indexOf(geo.id) !== -1;

              let region: string | undefined;
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

              // Default: dark with grid pattern for non-region countries
              let fillColor = "#18181b";
              let strokeColor = "#3f3f46";

              if (region) {
                // Use muted fill colors for regions
                fillColor = regionColors[region];
                strokeColor = regionAccentColors[region];

                // If we're pinging and this isn't the active region, dim it
                if (activeRegion && activeRegion !== region) {
                  fillColor = mix(0.7, fillColor, "#09090b");
                  strokeColor = "#27272a";
                } else if (activeRegion === region) {
                  // Brighten the active region slightly
                  fillColor = lighten(0.05, fillColor);
                }
              }

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={region ? 0.8 : 0.3}
                />
              );
            })}

            {/* Connection line with neon glow effect */}
            {mode.type !== "globe" && (
              <>
                {/* Glow layer */}
                <Line
                  coordinates={points}
                  stroke={orangeColor}
                  strokeWidth={6}
                  strokeOpacity={0.3}
                />
                {/* Main line */}
                <Line
                  coordinates={points}
                  stroke={orangeColor}
                  strokeWidth={2}
                  strokeDasharray="8,4"
                />
              </>
            )}

            {/* Datacenter markers */}
            {datacenters.map((dc) => {
              const projected = projection(dc.location as [number, number]);
              if (!projected) return null;

              // Get the accent color for this DC's region
              let accentColor = regionAccentColors[dc.region] || "#71717a";

              const focusId =
                (mode.type === "globe" && mode.highlightedDcd) ||
                (mode.type === "dc-focus" && mode.dcId) ||
                undefined;

              const isFocused = focusId === dc.id;
              const isDimmed = focusId && !isFocused;

              if (isDimmed) {
                accentColor = mix(0.6, accentColor, "#09090b");
              }

              const [cx, cy] = projected;
              return (
                <g key={dc.name}>
                  {/* Outer glow for focused DC */}
                  {isFocused && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={12}
                      fill="none"
                      stroke={accentColor}
                      strokeWidth={2}
                      strokeOpacity={0.4}
                    />
                  )}
                  {/* DC marker - square for retro feel */}
                  <rect
                    x={cx - 4}
                    y={cy - 4}
                    width={8}
                    height={8}
                    fill={darken(0.2, accentColor)}
                    stroke={isFocused ? "#fff" : lighten(0.2, accentColor)}
                    strokeWidth={isFocused ? 2 : 1}
                    style={{ transform: `rotate(45deg)`, transformOrigin: `${cx}px ${cy}px` }}
                  >
                    <title>{dc.name}</title>
                  </rect>
                </g>
              );
            })}

            {/* User location marker */}
            {(mode.type === "globe" || mode.type === "ping-region") && (
              <Marker coordinates={mode.location}>
                {/* Pulsing ring effect */}
                <circle
                  r={20}
                  fill="none"
                  stroke={orangeColor}
                  strokeWidth={2}
                  strokeOpacity={0.3}
                >
                  <animate
                    attributeName="r"
                    from="10"
                    to="30"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-opacity"
                    from="0.5"
                    to="0"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                {/* Inner marker */}
                <circle
                  r={8}
                  fill={darkColor}
                  stroke={orangeColor}
                  strokeWidth={3}
                />
                <circle r={3} fill={orangeColor} />
              </Marker>
            )}
          </>
        )}
      </Geographies>
    </ComposableMap>
  );
};

export default MapChart;
