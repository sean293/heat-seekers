"use client";

import { useState } from "react";
import MapView from "@/components/MapView";

export default function Dashboard() {
  const [chartType, setChartType] = useState("line");

  return (
    <div className="min-h-screen bg-gray-200 px-6 py-10">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold text-orange-400 mb-8">
          Heat Wave Dashboard
        </h1>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow mb-8 flex gap-6">

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Visualization Type
            </label>

            <select
              className="border rounded-lg px-3 py-2 text-gray-700"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
            >
              <option value="line">Time Series</option>
              <option value="heatmap">Heat Map</option>
              <option value="map">Geographic Map</option>
            </select>
          </div>

        </div>

        {/* Visualization Container */}
        <div className="bg-white rounded-xl shadow h-[500px] flex items-center justify-center text-gray-500">

          {chartType === "line" && <p>Time Series Chart Placeholder</p>}
          {chartType === "heatmap" && <p>Heat Map Placeholder</p>}
          {chartType === "map" && <MapView />}

        </div>

      </div>

    </div>
  );
}