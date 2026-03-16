import { useEffect, useState } from "react";

type UserLocationState = {
  userLocation?: [number, number];
  error?: string;
};

export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({});

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      try {
        const res = await fetch(
          "https://ipv4-check-perf.radar.cloudflare.com/api/info",
          { signal },
        );
        const json = (await res.json()) as {
          latitude?: string;
          longitude?: string;
        };

        if (
          typeof json.latitude === "string" &&
          typeof json.longitude === "string"
        ) {
          setState({ userLocation: [+json.longitude, +json.latitude] });
          return;
        }

        console.log("Cloudflare Response: ", json);
        setState({ error: "failed to get your location details from Cloudflare" });
      } catch (error) {
        if (signal.aborted) {
          return;
        }

        setState({
          error:
            error instanceof Error
              ? error.message
              : "failed to get your location details from Cloudflare",
        });
      }
    })();

    return () => controller.abort();
  }, []);

  return state;
}
