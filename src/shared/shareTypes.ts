export type PingSummary = {
  dc: string;
  dc_id: number;
  region: string;
  serverIp: string;
  clientIp: string;
  latencyMax: number;
  latencyMin: number;
  latencyAvg: number;
  latencyJitter: number;
  clientIpChanged: boolean;
  error?: string;
};

export type PingResults = Record<string, PingSummary>;

export type ShareSnapshot = {
  version: number;
  createdAt: string;
  pingResults: PingResults;
  bestTargetIndex?: number;
  selectedTargetIndex?: number;
  userLocation?: [number, number];
};

export type CreateShareRequest = {
  pingResults: PingResults;
  bestTargetIndex?: number;
  selectedTargetIndex?: number;
  userLocation?: [number, number];
};

export type CreateShareResponse = {
  shareId: string;
  shareUrl: string;
};
