"use client";
import { useState } from "react";
import MapView from "@/components/MapView";
import TempLineChart from "@/components/LineChart";

const MONTHS = [[5,"May"],[6,"Jun"],[7,"Jul"],[8,"Aug"],[9,"Sep"]] as const;
const YEARS = Array.from({ length: 41 }, (_, i) => 1981 + i);

export default function Dashboard() {
  const [chartType, setChartType] = useState("map");
  const [state, setState] = useState("");

  // Single month mode
  const [year, setYear] = useState(2012);
  const [month, setMonth] = useState(7);

  // Range mode
  const [rangeMode, setRangeMode] = useState(false);
  const [startYear, setStartYear] = useState(2010);
  const [startMonth, setStartMonth] = useState(5);
  const [endYear, setEndYear] = useState(2012);
  const [endMonth, setEndMonth] = useState(9);

  return (
    <div className="min-h-screen bg-gray-200 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-orange-400 mb-8">
          Heat Wave Dashboard
        </h1>

        {/* Controls */}
        <div className="bg-white p-6 rounded-xl shadow mb-8 flex flex-wrap gap-6 items-end">
          
          {/* Visualization Type */}
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
              {/* Single vs Range toggle */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Query Mode
                </label>
                <select
                  className="border rounded-lg px-3 py-2 text-gray-700"
                  value={rangeMode ? "range" : "single"}
                  onChange={(e) => setRangeMode(e.target.value === "range")}
                >
                  <option value="single">Single Month</option>
                  <option value="range">Date Range Average</option>
                </select>
              </div>

              {!rangeMode ? (
                /* Single month controls */
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Year</label>
                    <select
                      className="border rounded-lg px-3 py-2 text-gray-700"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                    >
                      {YEARS.map((y) => (
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
                      {MONTHS.map(([m, label]) => (
                        <option key={m} value={m}>{label}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                /* Range controls */
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Start Year</label>
                    <select
                      className="border rounded-lg px-3 py-2 text-gray-700"
                      value={startYear}
                      onChange={(e) => setStartYear(Number(e.target.value))}
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Start Month</label>
                    <select
                      className="border rounded-lg px-3 py-2 text-gray-700"
                      value={startMonth}
                      onChange={(e) => setStartMonth(Number(e.target.value))}
                    >
                      {MONTHS.map(([m, label]) => (
                        <option key={m} value={m}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">End Year</label>
                    <select
                      className="border rounded-lg px-3 py-2 text-gray-700"
                      value={endYear}
                      onChange={(e) => setEndYear(Number(e.target.value))}
                    >
                      {YEARS.filter(y => y >= startYear).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">End Month</label>
                    <select
                      className="border rounded-lg px-3 py-2 text-gray-700"
                      value={endMonth}
                      onChange={(e) => setEndMonth(Number(e.target.value))}
                    >
                      {MONTHS.map(([m, label]) => (
                        <option key={m} value={m}>{label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Jump to State */}
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
              rangeMode={rangeMode}
              startYear={startYear}
              startMonth={startMonth}
              endYear={endYear}
              endMonth={endMonth}
            />
          )}
        </div>
      </div>
    </div>
  );
}