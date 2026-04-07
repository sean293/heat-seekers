"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Temporary test data
const data = [
  { day: "Mon", temp: 32 },
  { day: "Tue", temp: 35 },
  { day: "Wed", temp: 37 },
  { day: "Thu", temp: 36 },
  { day: "Fri", temp: 39 },
  { day: "Sat", temp: 41 },
  { day: "Sun", temp: 38 },
];

export default function TempLineChart() {
  return (
    <div className="w-full h-[300px] bg-white rounded-xl p-4 shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-800">
        Weekly Temperature Trend
      </h2>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="day" />
          <YAxis unit="°C" />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="temp"
            stroke="#ef4444" // red
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}