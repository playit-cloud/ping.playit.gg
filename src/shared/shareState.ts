export type ShareState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "saving" }
  | {
      status: "ready";
      url: string;
      source: "created" | "loaded";
      copied: boolean;
    }
  | { status: "error"; message: string };
