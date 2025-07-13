import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Line,
  Sphere,
  type ProjectionConfig
} from "react-simple-maps";

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
  const scale = Math.max(300, baseScale * (60 / (maxSpan + 1))) * 0.8;

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

// List of US cities with their GPS coordinates
const usCities = [
  { name: "New York", coordinates: [-74.006, 40.7128] },
  { name: "Los Angeles", coordinates: [-118.2437, 34.0522] },
  { name: "Chicago", coordinates: [-87.6298, 41.8781] },
  { name: "Houston", coordinates: [-95.3698, 29.7604] },
  { name: "Phoenix", coordinates: [-112.074, 33.4484] },
  { name: "Philadelphia", coordinates: [-75.1652, 39.9526] },
  { name: "San Antonio", coordinates: [-98.4936, 29.4241] },
  { name: "San Diego", coordinates: [-117.1611, 32.7157] },
  { name: "Dallas", coordinates: [-96.797, 32.7767] },
  { name: "San Jose", coordinates: [-121.8863, 37.3382] }
];

const MapChart = () => {
    const points = [
      usCities[5].coordinates as [number, number],
      usCities[1].coordinates as [number, number],
    ];
  return (
    <ComposableMap
    projection="geoAzimuthalEqualArea"
    projectionConfig={getProjectionConfigForPoints(points[0], points[1])}
    >
      <Geographies geography={geoUrl} stroke="orange" strokeWidth={0.5}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const isHighlighted = europeGeoIds.indexOf(geo.id) !== -1;
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={isHighlighted ? "orange" : "url('#lines')"}
                onClick={() => console.log(geo.properties.name)}
              />
            );
          })
        }
      </Geographies>
      <Line coordinates={points} stroke="#F53" strokeWidth={2} />
      {/* Render orange circles for each US city */}
      {/* Project city coordinates to SVG points using the map projection */}
      {/* Project city coordinates to SVG points using the map projection */}
      <Geographies geography={geoUrl}>
        {({ projection }) => (
          <g>
            {usCities.map((city) => {
              const projected = projection(city.coordinates as [number, number]);
              if (!projected) return null;
              const [cx, cy] = projected;
              return (
                <circle
                  key={city.name}
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill="orange"
                  stroke="#fff"
                  strokeWidth={1}
                >
                  <title>{city.name}</title>
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
