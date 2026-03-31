"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

interface ExcdSummaryResponse {
  year: number;
  month: number;
  x: number[];
  y: number[];
  excd_mean: number[][];
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [year, setYear] = useState(2012);
  const [month, setMonth] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map once
  useEffect(() => {
    if (map.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-98, 39],
      zoom: 3,
    });
    map.current.addControl(new maplibregl.NavigationControl());
  }, []);

  // Fetch and render data when year/month changes
  useEffect(() => {
    if (!map.current) return;

    const fetchAndRender = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/excd/${year}/${month}/summary`
        );

        if (!res.ok) {
          setError(`No data for ${year}-${month.toString().padStart(2, "0")}`);
          setLoading(false);
          return;
        }

        const data: ExcdSummaryResponse = await res.json();

        // Subsample every 5th point to keep performance manageable
        const features: GeoJSON.Feature[] = [];
        for (let xi = 0; xi < data.x.length; xi += 5) {
          for (let yi = 0; yi < data.y.length; yi += 5) {
            const val = data.excd_mean[xi]?.[yi];
            if (val == null || val === 0) continue;
            features.push({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [data.x[xi], data.y[yi]],
              },
              properties: { value: val },
            });
          }
        }

        const geojson: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features,
        };

        const doRender = () => {
          // Remove old layer/source if present
          if (map.current!.getLayer("excd-points"))
            map.current!.removeLayer("excd-points");
          if (map.current!.getSource("excd"))
            map.current!.removeSource("excd");

          map.current!.addSource("excd", {
            type: "geojson",
            data: geojson,
          });

          map.current!.addLayer({
            id: "excd-points",
            type: "circle",
            source: "excd",
            paint: {
              "circle-radius": 3,
              "circle-opacity": 0.8,
              "circle-color": [
                "interpolate",
                ["linear"],
                ["get", "value"],
                0.1, "#ffffb2",
                0.3, "#fecc5c",
                0.5, "#fd8d3c",
                0.7, "#f03b20",
                1.0, "#bd0026",
              ],
            },
          });
        };

        if (map.current!.isStyleLoaded()) {
          doRender();
        } else {
          map.current!.once("load", doRender);
        }
      } catch (err) {
        setError("Failed to fetch data. Is the API awake?");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndRender();
  }, [year, month]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Controls */}
      <div className="flex gap-4 p-3 bg-gray-50 border-b items-center">
        <label className="text-sm font-medium text-gray-700">
          Year:
          <select
            className="ml-2 border rounded px-2 py-1 text-gray-700"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: 41 }, (_, i) => 1981 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Month:
          <select
            className="ml-2 border rounded px-2 py-1 text-gray-700"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {[
              [5, "May"], [6, "Jun"], [7, "Jul"],
              [8, "Aug"], [9, "Sep"],
            ].map(([m, label]) => (
              <option key={m} value={m}>{label}</option>
            ))}
          </select>
        </label>
        {loading && (
          <span className="text-sm text-orange-500 font-medium">Loading...</span>
        )}
        {error && (
          <span className="text-sm text-red-500 font-medium">{error}</span>
        )}
      </div>

      {/* Map */}
      <div ref={mapContainer} className="flex-1 rounded-b-lg" />
    </div>
  );
}