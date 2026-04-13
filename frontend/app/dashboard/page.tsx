"use client";
import { useState } from "react";
import MapView from "@/components/MapView";
import TempLineChart from "@/components/LineChart";

export default function Dashboard() {
  const [chartType, setChartType] = useState("map");
  const [year, setYear] = useState(2012);
  const [month, setMonth] = useState(7);
  const [state, setState] = useState("");

  return (
    <div className="min-h-screen bg-gray-200 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-orange-400 mb-8">
          Heat Wave Dashboard
        </h1>

        {/* Controls */}
        <div className="bg-white p-6 rounded-xl shadow mb-8 flex flex-wrap gap-6 items-end">
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
              <option value="map">Heat Map</option>
            </select>
          </div>

          {chartType === "map" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Year</label>
                <select
                  className="border rounded-lg px-3 py-2 text-gray-700"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {Array.from({ length: 41 }, (_, i) => 1981 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Month</label>
                <select
                  className="border rounded-lg px-3 py-2 text-gray-700"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {[[5,"May"],[6,"Jun"],[7,"Jul"],[8,"Aug"],[9,"Sep"]].map(([m, label]) => (
                    <option key={m} value={m}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Jump to State</label>
                <select
                  className="border rounded-lg px-3 py-2 text-gray-700"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">-- Select --</option>
                  {["AL","AZ","AR","CA","CO","CT","DE","FL","GA","ID","IL","IN","IA","KS",
                    "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
                    "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
                    "VT","VA","WA","WV","WI","WY"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Visualization */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {chartType === "line" && (
            <div className="p-6">
              <TempLineChart />
            </div>
          )}
          {chartType === "map" && (
            <MapView
              year={year}
              month={month}
              state={state}
              onResetState={() => setState("")}
            />
          )}
        </div>
      </div>
    </div>
  );
}