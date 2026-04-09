"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type * as GeoJSON from "geojson";

const DEFAULT_VIEW = {
  center: [-98, 39] as [number, number],
  zoom: 3,
  bearing: 0,
  pitch: 0,
};

interface ExcdSummaryResponse {
  year: number;
  month: number;
  x: number[];
  y: number[];
  excd_mean: (number | null)[][];
}

function convertGridToGeoJSON(data: ExcdSummaryResponse): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (let xi = 0; xi < data.x.length; xi += 1) {
    for (let yi = 0; yi < data.y.length; yi += 2) {
      const value = data.excd_mean[xi]?.[yi];
      if (value === null || value === undefined || value === 0) continue;
      features.push({
        type: "Feature",
        properties: { temp: value },
        geometry: {
          type: "Point",
          coordinates: [data.x[xi], data.y[yi]],
        },
      });
    }
  }
  return { type: "FeatureCollection", features };
}

const stateCenters: Record<string, [number, number]> = {
  AL: [-86.7, 32.8], AZ: [-111.7, 34.3], AR: [-92.4, 34.8], CA: [-119.4, 36.5],
  CO: [-105.5, 39.0], CT: [-72.7, 41.6], DE: [-75.5, 39.0], FL: [-81.5, 27.8],
  GA: [-83.4, 32.7], ID: [-114.0, 44.0], IL: [-89.0, 40.0], IN: [-86.3, 40.0],
  IA: [-93.5, 42.0], KS: [-98.0, 38.5], KY: [-85.5, 37.8], LA: [-92.3, 31.0],
  ME: [-69.0, 45.0], MD: [-76.7, 39.0], MA: [-71.8, 42.2], MI: [-85.5, 44.0],
  MN: [-94.0, 46.0], MS: [-89.7, 32.7], MO: [-92.5, 38.5], MT: [-110.0, 47.0],
  NE: [-99.5, 41.5], NV: [-116.0, 39.5], NH: [-71.5, 44.0], NJ: [-74.5, 40.1],
  NM: [-106.0, 34.5], NY: [-75.0, 43.0], NC: [-79.0, 35.5], ND: [-100.5, 47.5],
  OH: [-82.8, 40.4], OK: [-97.5, 35.5], OR: [-120.5, 44.0], PA: [-77.5, 41.0],
  RI: [-71.5, 41.6], SC: [-80.9, 33.8], SD: [-100.0, 44.5], TN: [-86.6, 35.8],
  TX: [-99.3, 31.0], UT: [-111.7, 39.3], VT: [-72.7, 43.8], VA: [-78.5, 37.5],
  WA: [-120.7, 47.4], WV: [-80.7, 38.9], WI: [-89.5, 44.5], WY: [-107.5, 43.0],
};

export default function MapView({
  year,
  month,
  state,
  onResetState,
}: {
  year: number;
  month: number;
  state: string;
  onResetState: () => void;
}) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetView() {
    if (map.current) {
      map.current.flyTo({
        center: DEFAULT_VIEW.center,
        zoom: DEFAULT_VIEW.zoom,
        bearing: DEFAULT_VIEW.bearing,
        pitch: DEFAULT_VIEW.pitch,
        speed: 1.5,
        curve: 1.2,
        duration: 900,
        essential: true,
      });
    }
    onResetState();
  }

  useEffect(() => {
    if (map.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-98, 39],
      zoom: 3,
      minZoom: 0,
      maxZoom: 5.5,
      maxBounds: [[-140, 18], [-55, 54]],
    });
    map.current.addControl(new maplibregl.NavigationControl());
    map.current.on("load", () => {
      map.current!.addSource("heat-data", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.current!.addLayer({
        id: "heat-layer",
        type: "heatmap",
        source: "heat-data",
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "temp"],
            0, 0,
            1, 1
          ],

          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3, 0.5,   
            5.5, 0.6  
          ],

          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0, 0, 255, 0)",
            0.2, "blue",
            0.4, "cyan",
            0.6, "yellow",
            0.8, "orange",
            1, "red",
          ],
          "heatmap-radius": [
            "interpolate",
            ["exponential", 2],
            ["zoom"],
            3, 3.65,
            5.5, 18 
          ],
          "heatmap-opacity": 0.8,
        },
      });
      requestAnimationFrame(() => map.current?.resize());
      setMapLoaded(true);
    });
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Fetch real data when year/month changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const fetchAndRender = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/excd/${year}/${month}/summary/chunked`
        );
        if (!res.ok) {
          setError(`No data for ${year}-${String(month).padStart(2, "0")}`);
          return;
        }
        const data: ExcdSummaryResponse = await res.json();
        const geojson = convertGridToGeoJSON(data);
        const source = map.current!.getSource("heat-data") as maplibregl.GeoJSONSource;
        if (source) source.setData(geojson);
      } catch {
        setError("Failed to fetch data. Is the API awake?");
      } finally {
        setLoading(false);
      }
    };
    fetchAndRender();
  }, [year, month, mapLoaded]);

  // Fly to state when selected
  useEffect(() => {
    if (!map.current || !state || !mapLoaded) return;
    const center = stateCenters[state];
    if (center) map.current.flyTo({ center, zoom: 5, speed: 1.2, curve: 1.2 });
  }, [state, mapLoaded]);

  return (
    <div className="relative w-full h-[500px]">
      <button
        onClick={resetView}
        className="absolute top-3 right-12 z-20 bg-white shadow px-3 py-1 rounded-md text-sm hover:bg-gray-100 text-gray-700 transition"
      >
        Reset View
      </button>
      {loading && (
        <div className="absolute top-3 left-3 z-20 bg-white shadow px-3 py-1 rounded-md text-sm text-orange-500">
          Loading...
        </div>
      )}
      {error && (
        <div className="absolute top-3 left-3 z-20 bg-white shadow px-3 py-1 rounded-md text-sm text-red-500">
          {error}
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
    </div>
  );
}