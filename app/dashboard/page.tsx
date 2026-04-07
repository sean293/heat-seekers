"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import TempLineChart from "@/components/LineChart";

export default function Dashboard() {
  const [chartType, setChartType] = useState("map");
  const [month, setMonth] = useState("2020-07");
  const [state, setState] = useState("");

  return (
    <div className="min-h-screen bg-gray-200 px-6 py-10">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold text-orange-400 mb-8">
          Heat Wave Dashboard
        </h1>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow mb-8 flex flex-col md:flex-row gap-6">

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Visualization Type
            </label>

            <select
              className="border rounded-lg px-3 py-2 text-gray-700"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
            >
              <option value="map">Heat Map</option>
              <option value="line">Temperature Trend</option>
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Month
            </label>

            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded-lg px-3 py-2 text-gray-700"
            />
          </div>

          {/* US State Selector */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              State
            </label>

            <select
              className="border rounded-lg px-3 py-2 text-gray-700"
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              <option value="">Select a state</option>
              <option value="AL">Alabama</option>
              <option value="AZ">Arizona</option>
              <option value="AR">Arkansas</option>
              <option value="CA">California</option>
              <option value="CO">Colorado</option>
              <option value="CT">Connecticut</option>
              <option value="DE">Delaware</option>
              <option value="FL">Florida</option>
              <option value="GA">Georgia</option>
              <option value="ID">Idaho</option>
              <option value="IL">Illinois</option>
              <option value="IN">Indiana</option>
              <option value="IA">Iowa</option>
              <option value="KS">Kansas</option>
              <option value="KY">Kentucky</option>
              <option value="LA">Louisiana</option>
              <option value="ME">Maine</option>
              <option value="MD">Maryland</option>
              <option value="MA">Massachusetts</option>
              <option value="MI">Michigan</option>
              <option value="MN">Minnesota</option>
              <option value="MS">Mississippi</option>
              <option value="MO">Missouri</option>
              <option value="MT">Montana</option>
              <option value="NE">Nebraska</option>
              <option value="NV">Nevada</option>
              <option value="NH">New Hampshire</option>
              <option value="NJ">New Jersey</option>
              <option value="NM">New Mexico</option>
              <option value="NY">New York</option>
              <option value="NC">North Carolina</option>
              <option value="ND">North Dakota</option>
              <option value="OH">Ohio</option>
              <option value="OK">Oklahoma</option>
              <option value="OR">Oregon</option>
              <option value="PA">Pennsylvania</option>
              <option value="RI">Rhode Island</option>
              <option value="SC">South Carolina</option>
              <option value="SD">South Dakota</option>
              <option value="TN">Tennessee</option>
              <option value="TX">Texas</option>
              <option value="UT">Utah</option>
              <option value="VT">Vermont</option>
              <option value="VA">Virginia</option>
              <option value="WA">Washington</option>
              <option value="WV">West Virginia</option>
              <option value="WI">Wisconsin</option>
              <option value="WY">Wyoming</option>
            </select>
          </div>

        </div>

        {/* Visualization Container */}
        <div className="bg-white rounded-xl shadow min-h-[500px] overflow-hidden relative">

          {chartType === "line" && <TempLineChart />}
          {chartType === "map" && <MapView
            month={month}
            state={state}
            onResetState={() => setState("")}
            />}

        </div>

      </div>

    </div>
  );
}