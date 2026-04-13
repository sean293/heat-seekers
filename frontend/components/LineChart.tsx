"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ReferenceLine,
} from "recharts";

interface HSCIRecord {
  time: number;
  HSCI: number;
}

interface AnnualPoint {
  year: number;
  hsci: number;
  decade: string;
}

interface MonthPoint {
  month: string;
  avgHsci: number;
}

interface DecadePoint {
  decade: string;
  avgHsci: number;
}

const MONTH_NAMES: Record<number, string> = {
  5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep",
};

function processAnnual(records: HSCIRecord[]): AnnualPoint[] {
  const byYear: Record<number, number[]> = {};
  for (const r of records) {
    const dateStr = String(r.time);
    const year = parseInt(dateStr.slice(0, 4));
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(r.HSCI);
  }
  return Object.entries(byYear)
    .map(([year, vals]) => ({
      year: parseInt(year),
      hsci: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3)),
      decade: `${Math.floor(parseInt(year) / 10) * 10}s`,
    }))
    .sort((a, b) => a.year - b.year);
}

function processMonthly(records: HSCIRecord[]): MonthPoint[] {
  const byMonth: Record<number, number[]> = {};
  for (const r of records) {
    const dateStr = String(r.time);
    const month = parseInt(dateStr.slice(4, 6));
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(r.HSCI);
  }
  return Object.entries(byMonth)
    .map(([month, vals]) => ({
      month: MONTH_NAMES[parseInt(month)] ?? month,
      avgHsci: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3)),
    }))
    .sort((a, b) => {
      const order = ["May", "Jun", "Jul", "Aug", "Sep"];
      return order.indexOf(a.month) - order.indexOf(b.month);
    });
}

function processDecades(annual: AnnualPoint[]): DecadePoint[] {
  const byDecade: Record<string, number[]> = {};
  for (const pt of annual) {
    if (!byDecade[pt.decade]) byDecade[pt.decade] = [];
    byDecade[pt.decade].push(pt.hsci);
  }
  return Object.entries(byDecade)
    .map(([decade, vals]) => ({
      decade,
      avgHsci: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3)),
    }))
    .sort((a, b) => parseInt(a.decade) - parseInt(b.decade));
}

export default function TempLineChart() {
  const [annual, setAnnual] = useState<AnnualPoint[]>([]);
  const [monthly, setMonthly] = useState<MonthPoint[]>([]);
  const [decades, setDecades] = useState<DecadePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/hsci`)
      .then(res => res.json())
      .then(json => {
        const records: HSCIRecord[] = json.data;
        const annualData = processAnnual(records);
        setAnnual(annualData);
        setMonthly(processMonthly(records));
        setDecades(processDecades(annualData));
      })
      .catch(() => setError("Failed to load HSCI data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="text-center py-12 text-orange-500 font-medium">
      Loading HSCI data...
    </div>
  );

  if (error) return (
    <div className="text-center py-12 text-red-500 font-medium">{error}</div>
  );

  // Compute overall mean for reference line
  const overallMean = annual.length
    ? parseFloat((annual.reduce((a, b) => a + b.hsci, 0) / annual.length).toFixed(3))
    : 0;

  return (
    <div className="space-y-10">

      {/* Chart 1: Annual HSCI Timeseries */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="text-lg font-semibold mb-1 text-gray-800">
          Annual HSCI Trend (1981–2021)
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Mean daily Heatwave Severity and Coverage Index per year. Higher values indicate more severe and widespread heatwaves [1].
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={annual}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(val) => [typeof val === "number" ? val.toFixed(3) : "N/A", "HSCI"]}
              labelFormatter={(label) => `Year: ${label}`}
            />
            <ReferenceLine
              y={overallMean}
              stroke="#f97316"
              strokeDasharray="4 4"
              label={{ value: "Mean", position: "insideTopRight", fontSize: 11, fill: "#f97316" }}
            />
            <Line
              type="monotone"
              dataKey="hsci"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: Average HSCI by Month */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="text-lg font-semibold mb-1 text-gray-800">
          Average HSCI by Month (1981–2021)
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Which months historically produce the most severe heatwaves across CONUS [1].
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(val) => [typeof val === "number" ? val.toFixed(3) : "N/A", "Avg HSCI"]}
            />
            <Bar dataKey="avgHsci" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 3: Decade Comparison */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="text-lg font-semibold mb-1 text-gray-800">
          Average HSCI by Decade
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Long-term trend in heatwave severity grouped by decade — useful for communicating climate change impacts to policymakers [1].
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={decades}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="decade" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(val) => [typeof val === "number" ? val.toFixed(3) : "N/A", "Avg HSCI"]}
            />
            <Legend />
            <Bar dataKey="avgHsci" name="Avg HSCI" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}