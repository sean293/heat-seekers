"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
{/* import test data */}
import { fakeDataByMonth } from "./testHeatData";
import type * as GeoJSON from "geojson";
import usStatesGeoJSON from "./us-states.json"

const DEFAULT_VIEW = {
  center: [-98, 39] as [number, number],
  zoom: 3,
  bearing: 0,
  pitch: 0,
};

// converst grid data to GeoJSON format for MapLibre
function convertGridToGeoJSON(data: any): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (let i = 0; i < data.y.length; i++) {
    for (let j = 0; j < data.x.length; j++) {
      const value = data.excd_mean[i][j];

      if (value === null) continue;

      features.push({
        type: "Feature",
        properties: {
          temp: value,
        },
        geometry: {
          type: "Point",
          coordinates: [data.x[j], data.y[i]],
        },
      });
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

export default function MapView({ month, state, onResetState }: { month: string; state: string; onResetState: () => void }) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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

  // US state centers for flyTo
  const stateCenters: Record<string, [number, number]> = {
    AL: [-86.7, 32.8], AZ: [-111.7, 34.3], AR: [-92.4, 34.8], CA: [-119.4, 36.5], 
    CO: [-105.5, 39.0], CT: [-72.7, 41.6], DE: [-75.5, 39.0], FL: [-81.5, 27.8], 
    GA: [-83.4, 32.7], ID: [-114.0, 44.0],  IL: [-89.0, 40.0], IN: [-86.3, 40.0], 
    IA: [-93.5, 42.0], KS: [-98.0, 38.5],  KY: [-85.5, 37.8], LA: [-92.3, 31.0], 
    ME: [-69.0, 45.0], MD: [-76.7, 39.0],  MA: [-71.8, 42.2], MI: [-85.5, 44.0], 
    MN: [-94.0, 46.0], MS: [-89.7, 32.7],  MO: [-92.5, 38.5], MT: [-110.0, 47.0], 
    NE: [-99.5, 41.5], NV: [-116.0, 39.5],  NH: [-71.5, 44.0], NJ: [-74.5, 40.1], 
    NM: [-106.0, 34.5], NY: [-75.0, 43.0],  NC: [-79.0, 35.5], ND: [-100.5, 47.5], 
    OH: [-82.8, 40.4], OK: [-97.5, 35.5],  OR: [-120.5, 44.0], PA: [-77.5, 41.0], 
    RI: [-71.5, 41.6], SC: [-80.9, 33.8],  SD: [-100.0, 44.5], TN: [-86.6, 35.8], 
    TX: [-99.3, 31.0], UT: [-111.7, 39.3],  VT: [-72.7, 43.8], VA: [-78.5, 37.5], 
    WA: [-120.7, 47.4], WV: [-80.7, 38.9],  WI: [-89.5, 44.5], WY: [-107.5, 43.0],
  };

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-98, 39],
      zoom: 0,
      minZoom: 0,
      maxZoom: 5.5,
      maxBounds: [
        [-140, 18], // Southwest coordinates
        [-55, 54],  // Northeast coordinates
      ],
    });

    map.current.addControl(new maplibregl.NavigationControl());

    // When the map loads
    map.current.on("load", () => {
      // empty source initially
      map.current!.addSource("heat-data", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Add heatmap layer
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

          "heatmap-intensity": 3,

          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(0, 0, 255, 0)",
            0.2, "blue",
            0.4, "cyan",
            0.6, "yellow",
            0.8, "orange",
            1, "red"
          ],

          "heatmap-radius": 10,
          "heatmap-opacity": 0.8
        },
      });

      // Add state borders
      map.current!.addSource("states", {
        type: "geojson",
        data: usStatesGeoJSON as GeoJSON.FeatureCollection,
      });

      map.current!.addLayer({
        id: "state-borders",
        type: "line",
        source: "states",
        paint: {
          "line-color": "#333",
          "line-width": 1.2,
        },
      });


      requestAnimationFrame(() => {
        map.current?.resize();
      });

      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };

  }, []);

  // Update heatmap data when month changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const data = fakeDataByMonth[month];
    if(!data) return;

    const geojson = convertGridToGeoJSON(data);

    const source = map.current.getSource("heat-data") as maplibregl.GeoJSONSource;

    if (source) {
      source.setData(geojson);
    }
  }, [month, mapLoaded]);

// Fly to state when selected
  useEffect(() => {
    if (!map.current || !state || !mapLoaded) return;

    const center = stateCenters[state];
    if (center) {
      map.current.flyTo({ center, zoom: 5, speed: 1.2, curve: 1.2 });
    }
  }, [state]);

    // Add simple legend
  useEffect(() => {
    if (!map.current || map.current.getContainer().querySelector("#heat-legend") || !mapLoaded ) return;

    const legend = document.createElement("div");
    legend.id = "heat-legend";
    legend.className =
      "absolute bottom-8 right-4 bg-white bg-opacity-90 p-3 rounded shadow text-xs text-gray-700";
    legend.innerHTML = `
      <div class="mb-1 font-bold">Temperature °C</div>
      <div class="flex justify-between">
        <span>Low</span>
        <span>High</span>
      </div>
      <div class="h-2 w-full bg-gradient-to-r from-blue-500 via-cyan-300 via-yellow-300 via-orange-400 to-red-500 rounded mt-1"></div>
    `;
    map.current.getContainer().appendChild(legend);
  }, [mapLoaded]);


  return (
    <div className="relative w-full h-[500px]">

      {/* Reset View button */}
      <button
        onClick={resetView}
        className="absolute top-3 right-12 z-20 bg-white shadow px-3 py-1 rounded-md text-sm hover:bg-gray-100 text-gray-700 transition"
      >
        Reset View
      </button>

      {/* Map container */}
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg"
      />
    </div>
  );
}