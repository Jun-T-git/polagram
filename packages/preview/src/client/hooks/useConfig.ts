import yaml from 'js-yaml';
import { useEffect, useState } from 'react';

// We need types for the config. For now we interpret loosely or import from core if possible.
// Importing from core in the client might be tricky if it has node deps.
// We'll define a simple interface here.

interface PolagramConfig {
  targets: Target[];
}

interface Target {
  input: string;
  lenses?: Lens[];
  [key: string]: any;
}

interface Lens {
  name: string;
  [key: string]: any;
}

export function useConfig() {
  const [config, setConfig] = useState<PolagramConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/__api/config')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch config');
        return res.json();
      })
      .then((data) => {
        try {
          // Server now returns parsed and enriched config directly
          if (data.config) {
            setConfig(data.config);
          } else if (data.content) {
            // Fallback for static if unparsed
            const parsed = yaml.load(data.content) as PolagramConfig;
            setConfig(parsed);
          }
        } catch (_e) {
          setError('Failed to parse config');
        }
      })
      .catch((err) => {
        console.error(err);
        // If we fail to fetch (e.g. static build without json?), handle graceful fallback or static import logic?
        // For static build, we should fetch 'config.json' instead of '__api/config'.
        // We'll handle that later or adding a retry/fallback.
        // For now, try fetching 'api/config.json' (static) if API fails?
        fetch('api/config.json')
          .then((r) => r.json())
          .then((d) => {
            // For static build build.ts, we should probably output the parsed json directly.
            setConfig(d);
          })
          .catch(() => setError(String(err)));
      })
      .finally(() => setLoading(false));
  }, []);

  return { config, loading, error };
}
