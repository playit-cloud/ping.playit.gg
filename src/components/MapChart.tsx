import { useEffect, useMemo, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
  type ProjectionConfig,
} from "react-simple-maps";
import { darken, lighten, mix } from "polished";
import datacenters from "@/shared/pingDcs";

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

function getProjectionConfigForPoints(
  pointA: [number, number],
  pointB: [number, number],
): ProjectionConfig {
  const midLon = (pointA[0] + pointB[0]) / 2;
  const midLat = (pointA[1] + pointB[1]) / 2;
  const dLon = Math.abs(pointA[0] - pointB[0]);
  const dLat = Math.abs(pointA[1] - pointB[1]);
  const maxSpan = Math.max(dLon, dLat);
  const baseScale = 1100;
  const scale = Math.max(300, baseScale * (60 / (maxSpan + 1))) * 0.3;

  return {
    rotate: [-midLon, 0, 0],
    center: [0, midLat],
    scale,
  };
}

const europeGeoIds = [
  "ALB",
  "AND",
  "AUT",
  "BLR",
  "BEL",
  "BIH",
  "BGR",
  "HRV",
  "CYP",
  "CZE",
  "DNK",
  "EST",
  "FIN",
  "FRA",
  "DEU",
  "GRC",
  "HUN",
  "IRL",
  "ITA",
  "LVA",
  "LIE",
  "LTU",
  "LUX",
  "MLT",
  "MDA",
  "MCO",
  "MNE",
  "NLD",
  "MKD",
  "NOR",
  "POL",
  "PRT",
  "ROU",
  "SMR",
  "SRB",
  "SVK",
  "SVN",
  "ESP",
  "SWE",
  "CHE",
  "UKR",
  "GBR",
  "VAT",
];

const northAmericaGeoIds = ["USA", "CAN", "MEX"];

const latinAmericaGeoIds = [
  "ARG",
  "BOL",
  "BRA",
  "CHL",
  "COL",
  "ECU",
  "PRY",
  "PER",
  "URY",
  "VEN",
  "GUY",
  "SUR",
  "GUF",
];

const indiaGeoIds = ["IND", "BGD"];

const asiaGeoIds = [
  "JPN",
  "KOR",
  "AUS",
  "NZL",
  "IDN",
  "PHL",
  "THA",
  "VNM",
  "MYS",
  "SGP",
  "PNG",
];

const orangeColor = "#f97316";
const blueColor = "#0ea5e9";
const magentaColor = "#d946ef";
const darkColor = "#0a0e1a";
const greenColor = "#10b981";
const redColor = "#ef4444";

const regionColors: Record<string, string> = {
  europe: "#1e3a5f",
  "north-america": "#4a2c17",
  "south-america": "#4a1c1c",
  india: "#3d1f4a",
  asia: "#1a3d32",
};

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

export default function MapChart({ mode }: { mode: Mode }) {
  const points = [[0, 0] as [number, number], [0, 0] as [number, number]];

  if (mode.type === "ping-region") {
    points[0][0] = mode.location[0];
    points[0][1] = mode.location[1];

    const dc = datacenters.find((value) => value.id === mode.target.dc_id);
    if (dc) {
      points[1][0] = dc.location[0];
      points[1][1] = dc.location[1];
    }
  }

  const targetProjection = useMemo(() => {
    let singleGps: [number, number] | undefined = undefined;

    if (mode.type === "globe") {
      if (mode.highlightedDcd) {
        const dc = datacenters.find((value) => value.id === mode.highlightedDcd);
        if (dc) {
          return getProjectionConfigForPoints(
            [mode.location[0], mode.location[1]],
            dc.location as [number, number],
          );
        }
      }
      singleGps = [mode.location[0], mode.location[1]];
    } else if (mode.type === "dc-focus") {
      const dc = datacenters.find((value) => value.id === mode.dcId);
      singleGps = dc?.location as [number, number] | undefined;
    }

    if (singleGps) {
      return {
        rotate: [0.0 - singleGps[0], 0.0, 0.0],
        center: [0, singleGps[1]],
        scale: 1100 * 0.5,
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

  const activeRegion = mode.type === "ping-region" ? mode.target.region : null;

  return (
    <ComposableMap
      projection="geoConicEquidistant"
      projectionConfig={projection}
      width={800}
      height={600}
      style={{ backgroundColor: "#0a0e1a", width: "100%", height: "100%" }}
    >
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
            stroke="#1e2a45"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>

      <Geographies
        geography={geoUrl}
        stroke="#1e2a45"
        strokeWidth={0.5}
      >
        {({ geographies, projection: projectionFn }) => (
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

              let fillColor = "#0f1629";
              let strokeColor = "#1e2a45";

              if (region) {
                fillColor = regionColors[region];
                strokeColor = regionAccentColors[region];

                if (activeRegion && activeRegion !== region) {
                  fillColor = mix(0.7, fillColor, "#0a0e1a");
                  strokeColor = "#1e2a45";
                } else if (activeRegion === region) {
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

            {mode.type !== "globe" && (
              <>
                <Line
                  coordinates={points}
                  stroke={orangeColor}
                  strokeWidth={6}
                  strokeOpacity={0.3}
                />
                <Line
                  coordinates={points}
                  stroke={orangeColor}
                  strokeWidth={2}
                  strokeDasharray="8,4"
                />
              </>
            )}

            {datacenters.map((dc) => {
              const projected = projectionFn(dc.location as [number, number]);
              if (!projected) return null;

              let accentColor = regionAccentColors[dc.region] || "#71717a";

              const focusId =
                (mode.type === "globe" && mode.highlightedDcd) ||
                (mode.type === "dc-focus" && mode.dcId) ||
                (mode.type === "ping-region" && mode.target.dc_id) ||
                undefined;

              const isFocused = focusId === dc.id;
              const isDimmed = focusId && !isFocused;

              if (isDimmed) {
                accentColor = mix(0.6, accentColor, "#0a0e1a");
              }

              const [cx, cy] = projected;
              return (
                <g key={dc.name}>
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
                  <rect
                    x={cx - 4}
                    y={cy - 4}
                    width={8}
                    height={8}
                    fill={darken(0.2, accentColor)}
                    stroke={isFocused ? "#fff" : lighten(0.2, accentColor)}
                    strokeWidth={isFocused ? 2 : 1}
                    style={{
                      transform: "rotate(45deg)",
                      transformOrigin: `${cx}px ${cy}px`,
                    }}
                  >
                    <title>{dc.name}</title>
                  </rect>
                </g>
              );
            })}

            {(mode.type === "globe" || mode.type === "ping-region") && (
              <Marker coordinates={mode.location}>
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
}
