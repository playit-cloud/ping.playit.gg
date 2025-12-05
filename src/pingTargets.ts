export type PingTarget = { id: string; name: string; target: string };
const pingTargets: PingTarget[] = [
  {
    id: "GlobalAnycast",
    name: "GlobalAnycast",
    target: "//gl.rt.playit.gg",
  },
  {
    id: "NorthAmerica",
    name: "NorthAmerica",
    target: "//na.rt.playit.gg",
  },
  { id: "Europe", name: "Europe", target: "//eu.rt.playit.gg" },
  { id: "Asia", name: "Asia", target: "//as.rt.playit.gg" },
  { id: "India", name: "India", target: "//in.rt.playit.gg" },
  {
    id: "SouthAmerica",
    name: "SouthAmerica",
    target: "//sa.rt.playit.gg",
  },
  { id: "Chile", name: "Chile", target: "//chl.rt.playit.gg" },
  {
    id: "SeattleWashington",
    name: "SeattleWashington",
    target: "//sea.rt.playit.gg",
  },
  {
    id: "LosAngelesCalifornia",
    name: "LosAngelesCalifornia",
    target: "//los.rt.playit.gg",
  },
  {
    id: "DenverColorado",
    name: "DenverColorado",
    target: "//den.rt.playit.gg",
  },
  {
    id: "DallasTexas",
    name: "DallasTexas",
    target: "//dal.rt.playit.gg",
  },
  {
    id: "ChicagoIllinois",
    name: "ChicagoIllinois",
    target: "//chi.rt.playit.gg",
  },
  { id: "NewYork", name: "NewYork", target: "//nyc.rt.playit.gg" },
  {
    id: "UnitedKingdom",
    name: "UnitedKingdom",
    target: "//gbr.rt.playit.gg",
  },
  { id: "Germany", name: "Germany", target: "//deu.rt.playit.gg" },
  { id: "Sweden", name: "Sweden", target: "//swe.rt.playit.gg" },
  { id: "Poland", name: "Poland", target: "//pol.rt.playit.gg" },
  { id: "Romania", name: "Romania", target: "//rou.rt.playit.gg" },
  { id: "Japan", name: "Japan", target: "//jpn.rt.playit.gg" },
  {
    id: "Australia",
    name: "Australia",
    target: "//aus.rt.playit.gg",
  },
];
export default pingTargets;
