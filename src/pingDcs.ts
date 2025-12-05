export type DcInfo = {
  id: number;
  region: string;
  name: string;
  location: [number, number];
};
const dcs: DcInfo[] = [
  { id: 0, region: "GlobalAnycast", name: "SameDc", location: [0, 0] },
  { id: 8, region: "GlobalAnycast", name: "SeattleStage1", location: [0, 0] },
  { id: 9, region: "GlobalAnycast", name: "SingaporeStage1", location: [0, 0] },
  {
    id: 11,
    region: "Sweden",
    name: "Stockholm2",
    location: [18.048653388695985, 59.33657399619439],
  },
  {
    id: 14,
    region: "GlobalAnycast",
    name: "FrankfurtStage1",
    location: [0, 0],
  },
  {
    id: 16,
    region: "Japan",
    name: "Tokyo1",
    location: [139.41240264074682, 35.76746133973248],
  },
  {
    id: 17,
    region: "Japan",
    name: "Seoul1",
    location: [139.41240264074682, 35.76746133973248],
  },
  {
    id: 18,
    region: "Asia",
    name: "Singapore1",
    location: [103.83051077322702, 1.3277254001758816],
  },
  {
    id: 19,
    region: "Australia",
    name: "Sydney1",
    location: [150.93332920967842, -33.76691004170151],
  },
  {
    id: 20,
    region: "SouthAmerica",
    name: "SaoPaulo1",
    location: [-46.58637823133386, -23.562189524660546],
  },
  {
    id: 22,
    region: "Poland",
    name: "Warsaw1",
    location: [21.063597359212938, 52.22179229685056],
  },
  {
    id: 28,
    region: "India",
    name: "Mumbai2",
    location: [72.88666880079465, 19.107503578348634],
  },
  {
    id: 32,
    region: "India",
    name: "Bangalore1",
    location: [77.61376959586156, 12.975468026994934],
  },
  {
    id: 33,
    region: "India",
    name: "Delhi1",
    location: [77.15672933005733, 28.66015590873483],
  },
  {
    id: 34,
    region: "Chile",
    name: "Santiago1",
    location: [-70.67857473988279, -33.44027937271199],
  },
  {
    id: 35,
    region: "Europe",
    name: "TelAviv1",
    location: [34.77973252980415, 32.07439687388667],
  },
  {
    id: 36,
    region: "Germany",
    name: "Frankfurt2",
    location: [8.613899978244735, 50.12861148866451],
  },
  {
    id: 37,
    region: "Europe",
    name: "Madrid2",
    location: [-3.698420677872644, 40.41415000976858],
  },
  {
    id: 38,
    region: "UnitedKingdom",
    name: "London2",
    location: [-0.09404995550022383, 51.51360453195452],
  },
  {
    id: 39,
    region: "Romania",
    name: "Bucharest1",
    location: [24.778527337450598, 46.27877701174077],
  },
  {
    id: 40,
    region: "LosAngelesCalifornia",
    name: "LosAngeles2",
    location: [-118.0589046010653, 34.03038111005251],
  },
  {
    id: 41,
    region: "NewYork",
    name: "NewYork2",
    location: [-73.95499265749402, 40.705346369898976],
  },
  {
    id: 42,
    region: "SeattleWashington",
    name: "Seattle2",
    location: [-122.3121966141084, 47.61115553762082],
  },
  {
    id: 43,
    region: "DenverColorado",
    name: "Denver1",
    location: [-104.9924719671019, 39.73958703133504],
  },
  {
    id: 44,
    region: "DallasTexas",
    name: "Dallas3",
    location: [-96.76178777245744, 32.80534829033479],
  },
  {
    id: 45,
    region: "NorthAmerica",
    name: "Miami3",
    location: [-80.21160716594312, 25.80217441920667],
  },
  {
    id: 46,
    region: "ChicagoIllinois",
    name: "Chicago2",
    location: [-87.6687977076936, 41.86024599381382],
  },
];
export default dcs;
