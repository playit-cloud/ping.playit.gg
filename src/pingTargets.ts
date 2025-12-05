export type PingTarget = { id: string; name: string; target: string };
const pingTargets: PingTarget[] = [
  {
    id: "GlobalAnycast",
    name: "GlobalAnycast",
    target: "//gl.ip4.rt.playit.gg",
  },
  { id: "NorthAmerica", name: "NorthAmerica", target: "//na.ip4.rt.playit.gg" },
  { id: "Europe", name: "Europe", target: "//eu.ip4.rt.playit.gg" },
  { id: "Asia", name: "Asia", target: "//as.ip4.rt.playit.gg" },
  { id: "India", name: "India", target: "//in.ip4.rt.playit.gg" },
  { id: "SouthAmerica", name: "SouthAmerica", target: "//sa.ip4.rt.playit.gg" },
  { id: "Chile", name: "Chile", target: "//chl.ip4.rt.playit.gg" },
  {
    id: "SeattleWashington",
    name: "SeattleWashington",
    target: "//sea.ip4.rt.playit.gg",
  },
  {
    id: "LosAngelesCalifornia",
    name: "LosAngelesCalifornia",
    target: "//los.ip4.rt.playit.gg",
  },
  {
    id: "DenverColorado",
    name: "DenverColorado",
    target: "//den.ip4.rt.playit.gg",
  },
  { id: "DallasTexas", name: "DallasTexas", target: "//dal.ip4.rt.playit.gg" },
  {
    id: "ChicagoIllinois",
    name: "ChicagoIllinois",
    target: "//chi.ip4.rt.playit.gg",
  },
  { id: "NewYork", name: "NewYork", target: "//nyc.ip4.rt.playit.gg" },
  {
    id: "UnitedKingdom",
    name: "UnitedKingdom",
    target: "//gbr.ip4.rt.playit.gg",
  },
  { id: "Germany", name: "Germany", target: "//deu.ip4.rt.playit.gg" },
  { id: "Sweden", name: "Sweden", target: "//swe.ip4.rt.playit.gg" },
  { id: "Poland", name: "Poland", target: "//pol.ip4.rt.playit.gg" },
  { id: "Romania", name: "Romania", target: "//rou.ip4.rt.playit.gg" },
  { id: "Japan", name: "Japan", target: "//jpn.ip4.rt.playit.gg" },
  { id: "Australia", name: "Australia", target: "//aus.ip4.rt.playit.gg" },
];
export default pingTargets;
