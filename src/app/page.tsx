"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import AnimatedKPI from "@/components/AnimatedKPI";
import {
  data,
  sectors,
  years,
  getLatestYear,
  getOverallMedian,
  getSectorMedian,
  getSectorEvRevenueTimeSeries,
  getGrowthVsValuation,
  getRuleOf40Rankings,
  getMultipleCompression,
  getStockReturnRankings,
  formatBillions,
  formatPct,
  formatMultiple,
} from "@/lib/data";

const SECTOR_COLORS: Record<string, string> = {
  "Application SaaS": "#3b82f6",
  "Cloud Infrastructure": "#06b6d4",
  Cybersecurity: "#f59e0b",
  "Consumer Internet": "#ec4899",
  "E-Commerce": "#10b981",
  Fintech: "#8b5cf6",
  "Legacy Tech": "#6b7280",
  Semiconductors: "#ef4444",
};

const TAB_LIST = [
  "Overview",
  "Sector Analysis",
  "Growth vs Valuation",
  "Rule of 40",
  "Multiple Compression",
  "Stock Returns",
  "Company Table",
] as const;

type Tab = (typeof TAB_LIST)[number];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [selectedYear, setSelectedYear] = useState(getLatestYear());
  const [selectedSector, setSelectedSector] = useState<string>("All");

  const latestYear = getLatestYear();

  // KPI values
  const medianEvRev = getOverallMedian(latestYear, "ev_revenue");
  const medianEvRevPrior = getOverallMedian(latestYear - 1, "ev_revenue");
  const medianGrowth = getOverallMedian(latestYear, "revenue_growth");
  const medianR40 = getOverallMedian(latestYear, "rule_of_40");
  const medianOpMargin = getOverallMedian(latestYear, "operating_margin");
  const companiesCount = data.filter(
    (d) => d.year === latestYear && d.revenue !== null
  ).length;

  const evRevDelta =
    medianEvRev && medianEvRevPrior
      ? ((medianEvRev / medianEvRevPrior - 1) * 100)
      : null;

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-zinc-800 px-6 py-6"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            SaaS Valuation Benchmarks
          </h1>
          <p className="text-zinc-400 mt-1">
            73 public tech companies &middot; 2018&ndash;2026 &middot; Financial
            fundamentals, multiples &amp; efficiency metrics
          </p>
        </div>
      </motion.header>

      {/* Nav Tabs */}
      <div className="border-b border-zinc-800 px-6 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-1">
          {TAB_LIST.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "text-white border-b-2 border-blue-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Year + Sector Filters */}
      <div className="px-6 py-4 border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto flex gap-4 items-center">
          <label className="text-sm text-zinc-400">Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5"
          >
            {years
              .filter((y) => data.some((d) => d.year === y && d.revenue !== null))
              .map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
          </select>
          <label className="text-sm text-zinc-400 ml-4">Sector:</label>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5"
          >
            <option value="All">All Sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "Overview" && (
          <OverviewTab
            medianEvRev={medianEvRev}
            evRevDelta={evRevDelta}
            medianGrowth={medianGrowth}
            medianR40={medianR40}
            medianOpMargin={medianOpMargin}
            companiesCount={companiesCount}
          />
        )}
        {activeTab === "Sector Analysis" && (
          <SectorTab selectedYear={selectedYear} />
        )}
        {activeTab === "Growth vs Valuation" && (
          <ScatterTab selectedYear={selectedYear} selectedSector={selectedSector} />
        )}
        {activeTab === "Rule of 40" && (
          <RuleOf40Tab selectedYear={selectedYear} selectedSector={selectedSector} />
        )}
        {activeTab === "Multiple Compression" && <CompressionTab selectedSector={selectedSector} />}
        {activeTab === "Stock Returns" && <ReturnsTab />}
        {activeTab === "Company Table" && (
          <TableTab selectedYear={selectedYear} selectedSector={selectedSector} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-zinc-500">
          <p>Data sourced from Yahoo Finance (yfinance). Updated March 2026.</p>
          <div className="flex gap-6">
            <a
              href="https://x.com/Trace_Cohen"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Twitter / X
            </a>
            <a
              href="mailto:t@nyvp.com"
              className="hover:text-white transition-colors"
            >
              t@nyvp.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Overview Tab ─── */
function OverviewTab({
  medianEvRev,
  evRevDelta,
  medianGrowth,
  medianR40,
  medianOpMargin,
  companiesCount,
}: {
  medianEvRev: number | null;
  evRevDelta: number | null;
  medianGrowth: number | null;
  medianR40: number | null;
  medianOpMargin: number | null;
  companiesCount: number;
}) {
  const evRevTimeSeries = getSectorEvRevenueTimeSeries();

  // Overall median EV/Rev by year
  const overallTrend = years
    .map((y) => ({ year: y, median: getOverallMedian(y, "ev_revenue") }))
    .filter((d) => d.median !== null);

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <AnimatedKPI
          label="Median EV / Revenue"
          value={medianEvRev ?? 0}
          suffix="x"
          decimals={1}
          delta={evRevDelta}
          deltaLabel="YoY"
          delay={0}
        />
        <AnimatedKPI
          label="Median Revenue Growth"
          value={medianGrowth ?? 0}
          suffix="%"
          decimals={1}
          delay={0.1}
        />
        <AnimatedKPI
          label="Median Rule of 40"
          value={medianR40 ?? 0}
          decimals={1}
          delay={0.2}
        />
        <AnimatedKPI
          label="Median Op. Margin"
          value={medianOpMargin ?? 0}
          suffix="%"
          decimals={1}
          delay={0.3}
        />
        <AnimatedKPI
          label="Companies Tracked"
          value={companiesCount}
          decimals={0}
          delay={0.4}
        />
      </div>

      {/* Overall EV/Revenue Compression */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Median EV / Revenue Multiple Over Time
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={overallTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="year" stroke="#71717a" />
            <YAxis stroke="#71717a" tickFormatter={(v) => `${v}x`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fff",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [`${Number(v).toFixed(1)}x`, "Median EV/Rev"]}
            />
            <Line
              type="monotone"
              dataKey="median"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5, fill: "#3b82f6" }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Sector EV/Revenue Lines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          EV / Revenue by Sector
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={evRevTimeSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="year" stroke="#71717a" />
            <YAxis stroke="#71717a" tickFormatter={(v) => `${v}x`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fff",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => `${Number(v).toFixed(1)}x`}
            />
            <Legend />
            {sectors.map((s) => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                stroke={SECTOR_COLORS[s] || "#888"}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

/* ─── Sector Analysis Tab ─── */
function SectorTab({ selectedYear }: { selectedYear: number }) {
  const metrics = sectors.map((s) => ({
    sector: s,
    ev_revenue: getSectorMedian(s, selectedYear, "ev_revenue"),
    revenue_growth: getSectorMedian(s, selectedYear, "revenue_growth"),
    operating_margin: getSectorMedian(s, selectedYear, "operating_margin"),
    fcf_margin: getSectorMedian(s, selectedYear, "fcf_margin"),
    rule_of_40: getSectorMedian(s, selectedYear, "rule_of_40"),
    companies: data.filter(
      (d) => d.sector === s && d.year === selectedYear && d.revenue !== null
    ).length,
  }));

  return (
    <div className="space-y-8">
      {/* EV/Revenue by sector bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Median EV / Revenue by Sector ({selectedYear})
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={metrics} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}x`} />
            <YAxis
              type="category"
              dataKey="sector"
              stroke="#71717a"
              width={150}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fff",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => `${Number(v).toFixed(1)}x`}
            />
            <Bar dataKey="ev_revenue" radius={[0, 6, 6, 0]}>
              {metrics.map((m) => (
                <Cell
                  key={m.sector}
                  fill={SECTOR_COLORS[m.sector] || "#888"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Sector comparison table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 overflow-x-auto"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Sector Benchmarks ({selectedYear})
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-400 border-b border-zinc-800">
              <th className="text-left py-3 px-2">Sector</th>
              <th className="text-right py-3 px-2">Cos.</th>
              <th className="text-right py-3 px-2">EV/Rev</th>
              <th className="text-right py-3 px-2">Rev Growth</th>
              <th className="text-right py-3 px-2">Op Margin</th>
              <th className="text-right py-3 px-2">FCF Margin</th>
              <th className="text-right py-3 px-2">Rule of 40</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr
                key={m.sector}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
              >
                <td className="py-3 px-2 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: SECTOR_COLORS[m.sector] }}
                  />
                  <span className="text-white">{m.sector}</span>
                </td>
                <td className="text-right py-3 px-2 text-zinc-300">
                  {m.companies}
                </td>
                <td className="text-right py-3 px-2 text-white font-medium">
                  {formatMultiple(m.ev_revenue)}
                </td>
                <td className="text-right py-3 px-2 text-white">
                  {formatPct(m.revenue_growth)}
                </td>
                <td className="text-right py-3 px-2 text-white">
                  {formatPct(m.operating_margin)}
                </td>
                <td className="text-right py-3 px-2 text-white">
                  {formatPct(m.fcf_margin)}
                </td>
                <td
                  className={`text-right py-3 px-2 font-medium ${
                    (m.rule_of_40 ?? 0) >= 40
                      ? "text-emerald-400"
                      : "text-orange-400"
                  }`}
                >
                  {m.rule_of_40?.toFixed(1) ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

/* ─── Growth vs Valuation Scatter ─── */
function ScatterTab({
  selectedYear,
  selectedSector,
}: {
  selectedYear: number;
  selectedSector: string;
}) {
  const scatterData = useMemo(() => {
    let d = getGrowthVsValuation(selectedYear);
    if (selectedSector !== "All") d = d.filter((r) => r.sector === selectedSector);
    return d;
  }, [selectedYear, selectedSector]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6"
    >
      <h2 className="text-lg font-semibold text-white mb-2">
        Revenue Growth vs EV / Revenue ({selectedYear})
      </h2>
      <p className="text-sm text-zinc-400 mb-4">
        How the market prices growth. Higher-growth companies command higher
        multiples.
      </p>
      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            type="number"
            dataKey="revenue_growth"
            name="Revenue Growth"
            stroke="#71717a"
            tickFormatter={(v) => `${v}%`}
            label={{
              value: "Revenue Growth %",
              position: "insideBottom",
              offset: -5,
              fill: "#71717a",
            }}
          />
          <YAxis
            type="number"
            dataKey="ev_revenue"
            name="EV/Revenue"
            stroke="#71717a"
            tickFormatter={(v) => `${v}x`}
            label={{
              value: "EV / Revenue",
              angle: -90,
              position: "insideLeft",
              fill: "#71717a",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#fff",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any, name: any) =>
              name === "Revenue Growth"
                ? `${Number(v).toFixed(1)}%`
                : `${Number(v).toFixed(1)}x`
            }
            labelFormatter={() => ""}
            content={({ payload }) => {
              if (!payload || !payload[0]) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                  <p className="text-white font-semibold">
                    {d.ticker} — {d.company}
                  </p>
                  <p className="text-zinc-400">{d.sector}</p>
                  <p className="text-zinc-300 mt-1">
                    Growth: {d.revenue_growth.toFixed(1)}%
                  </p>
                  <p className="text-zinc-300">
                    EV/Rev: {d.ev_revenue.toFixed(1)}x
                  </p>
                </div>
              );
            }}
          />
          <Scatter data={scatterData}>
            {scatterData.map((d, i) => (
              <Cell
                key={i}
                fill={SECTOR_COLORS[d.sector] || "#888"}
                fillOpacity={0.8}
                r={6}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {sectors.map((s) => (
          <div key={s} className="flex items-center gap-2 text-xs text-zinc-400">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: SECTOR_COLORS[s] }}
            />
            {s}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Rule of 40 Tab ─── */
function RuleOf40Tab({
  selectedYear,
  selectedSector,
}: {
  selectedYear: number;
  selectedSector: string;
}) {
  const rankings = useMemo(() => {
    let d = getRuleOf40Rankings(selectedYear);
    if (selectedSector !== "All") d = d.filter((r) => r.sector === selectedSector);
    return d;
  }, [selectedYear, selectedSector]);

  const top20 = rankings.slice(0, 20);
  const bottom10 = rankings.slice(-10).reverse();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-2">
          Rule of 40 — Top 20 ({selectedYear})
        </h2>
        <p className="text-sm text-zinc-400 mb-4">
          Revenue Growth % + FCF Margin %. Above 40 = efficient growth.
        </p>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={top20} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis type="number" stroke="#71717a" />
            <YAxis
              type="category"
              dataKey="ticker"
              stroke="#71717a"
              width={60}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fff",
              }}
              content={({ payload }) => {
                if (!payload || !payload[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                    <p className="text-white font-semibold">
                      {d.ticker} — {d.company}
                    </p>
                    <p className="text-zinc-400">{d.sector}</p>
                    <p className="text-emerald-400 mt-1 font-medium">
                      Rule of 40: {d.rule_of_40.toFixed(1)}
                    </p>
                    <p className="text-zinc-300">
                      Growth: {d.revenue_growth?.toFixed(1)}%
                    </p>
                    <p className="text-zinc-300">
                      FCF Margin: {d.fcf_margin?.toFixed(1) ?? "—"}%
                    </p>
                  </div>
                );
              }}
            />
            <ReferenceLine x={40} stroke="#f59e0b" strokeDasharray="3 3" />
            <Bar dataKey="rule_of_40" radius={[0, 6, 6, 0]}>
              {top20.map((d) => (
                <Cell
                  key={d.ticker}
                  fill={d.rule_of_40 >= 40 ? "#10b981" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bottom 10 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Rule of 40 — Bottom 10 ({selectedYear})
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={bottom10} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis type="number" stroke="#71717a" />
            <YAxis
              type="category"
              dataKey="ticker"
              stroke="#71717a"
              width={60}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <ReferenceLine x={40} stroke="#f59e0b" strokeDasharray="3 3" />
            <Bar dataKey="rule_of_40" radius={[0, 6, 6, 0]}>
              {bottom10.map((d) => (
                <Cell
                  key={d.ticker}
                  fill={d.rule_of_40 >= 40 ? "#10b981" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

/* ─── Multiple Compression Tab ─── */
function CompressionTab({ selectedSector }: { selectedSector: string }) {
  const compressionData = useMemo(() => {
    let d = getMultipleCompression();
    if (selectedSector !== "All") d = d.filter((r) => r.sector === selectedSector);
    return d;
  }, [selectedSector]);

  // Show top 15 most compressed (negative) and top 10 least compressed / expanded
  const mostCompressed = compressionData.slice(0, 15);
  const leastCompressed = compressionData.slice(-10).reverse();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-2">
          Most Multiple Compression (Peak vs Current EV/Revenue)
        </h2>
        <p className="text-sm text-zinc-400 mb-4">
          How far multiples fell from their peak (usually 2021-2022).
        </p>
        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={mostCompressed} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}x`} />
            <YAxis
              type="category"
              dataKey="ticker"
              stroke="#71717a"
              width={60}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fff",
              }}
              content={({ payload }) => {
                if (!payload || !payload[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                    <p className="text-white font-semibold">
                      {d.ticker} — {d.company}
                    </p>
                    <p className="text-zinc-400">{d.sector}</p>
                    <p className="text-red-400 mt-1">
                      Peak ({d.peak_year}): {d.peak_ev_revenue.toFixed(1)}x
                    </p>
                    <p className="text-zinc-300">
                      Current ({d.latest_year}): {d.latest_ev_revenue.toFixed(1)}x
                    </p>
                    <p className="text-red-400 font-medium">
                      Change: {d.compression.toFixed(1)}x (
                      {d.compression_pct?.toFixed(0)}%)
                    </p>
                  </div>
                );
              }}
            />
            <ReferenceLine x={0} stroke="#71717a" />
            <Bar dataKey="compression" radius={[0, 6, 6, 0]}>
              {mostCompressed.map((d) => (
                <Cell
                  key={d.ticker}
                  fill={d.compression < 0 ? "#ef4444" : "#10b981"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Companies that expanded multiples */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Multiple Expansion (Beat the Compression)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={leastCompressed} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}x`} />
            <YAxis
              type="category"
              dataKey="ticker"
              stroke="#71717a"
              width={60}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <ReferenceLine x={0} stroke="#71717a" />
            <Bar dataKey="compression" radius={[0, 6, 6, 0]}>
              {leastCompressed.map((d) => (
                <Cell
                  key={d.ticker}
                  fill={d.compression >= 0 ? "#10b981" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

/* ─── Stock Returns Tab ─── */
function ReturnsTab() {
  const returns = getStockReturnRankings();
  const top15 = returns.slice(0, 15);
  const bottom15 = returns.slice(-15).reverse();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Best Stock Returns Since Jan 2020
        </h2>
        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={top15} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              type="number"
              stroke="#71717a"
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="ticker"
              stroke="#71717a"
              width={60}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fff",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => `${Number(v).toFixed(0)}%`}
            />
            <Bar dataKey="return_since_2020" radius={[0, 6, 6, 0]}>
              {top15.map((d) => (
                <Cell
                  key={d.ticker}
                  fill={SECTOR_COLORS[d.sector] || "#3b82f6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">
          Worst Stock Returns Since Jan 2020
        </h2>
        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={bottom15} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              type="number"
              stroke="#71717a"
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="ticker"
              stroke="#71717a"
              width={60}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fff",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => `${Number(v).toFixed(0)}%`}
            />
            <Bar dataKey="return_since_2020" radius={[0, 6, 6, 0]}>
              {bottom15.map((d) => (
                <Cell
                  key={d.ticker}
                  fill={d.return_since_2020 < 0 ? "#ef4444" : "#10b981"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

/* ─── Company Table Tab ─── */
function TableTab({
  selectedYear,
  selectedSector,
}: {
  selectedYear: number;
  selectedSector: string;
}) {
  const [sortField, setSortField] = useState<string>("ev_revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const tableData = useMemo(() => {
    let d = data.filter((r) => r.year === selectedYear && r.revenue !== null);
    if (selectedSector !== "All") d = d.filter((r) => r.sector === selectedSector);

    d.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aVal = (a as any)[sortField] as number | null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bVal = (b as any)[sortField] as number | null;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
    return d;
  }, [selectedYear, selectedSector, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortHeader = ({
    field,
    label,
  }: {
    field: string;
    label: string;
  }) => (
    <th
      className="text-right py-3 px-2 cursor-pointer hover:text-white transition-colors whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      {label}
      {sortField === field && (
        <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>
      )}
    </th>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 overflow-x-auto"
    >
      <h2 className="text-lg font-semibold text-white mb-4">
        All Companies ({selectedYear}) — {tableData.length} companies
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-zinc-400 border-b border-zinc-800">
            <th className="text-left py-3 px-2">Ticker</th>
            <th className="text-left py-3 px-2">Company</th>
            <th className="text-left py-3 px-2">Sector</th>
            <SortHeader field="revenue" label="Revenue" />
            <SortHeader field="revenue_growth" label="Growth" />
            <SortHeader field="gross_margin" label="GM %" />
            <SortHeader field="operating_margin" label="Op M%" />
            <SortHeader field="fcf_margin" label="FCF M%" />
            <SortHeader field="ev_revenue" label="EV/Rev" />
            <SortHeader field="pe" label="P/E" />
            <SortHeader field="rule_of_40" label="Ro40" />
            <SortHeader field="stock_return_since_2020" label="Ret 2020" />
          </tr>
        </thead>
        <tbody>
          {tableData.map((d) => (
            <tr
              key={d.ticker}
              className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
            >
              <td className="py-2.5 px-2 text-white font-medium">{d.ticker}</td>
              <td className="py-2.5 px-2 text-zinc-300 max-w-[160px] truncate">
                {d.company}
              </td>
              <td className="py-2.5 px-2">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${SECTOR_COLORS[d.sector]}20`,
                    color: SECTOR_COLORS[d.sector],
                  }}
                >
                  {d.sector}
                </span>
              </td>
              <td className="text-right py-2.5 px-2 text-zinc-300">
                {formatBillions(d.revenue)}
              </td>
              <td
                className={`text-right py-2.5 px-2 font-medium ${
                  (d.revenue_growth ?? 0) >= 20
                    ? "text-emerald-400"
                    : (d.revenue_growth ?? 0) >= 0
                    ? "text-zinc-300"
                    : "text-red-400"
                }`}
              >
                {formatPct(d.revenue_growth)}
              </td>
              <td className="text-right py-2.5 px-2 text-zinc-300">
                {formatPct(d.gross_margin)}
              </td>
              <td
                className={`text-right py-2.5 px-2 ${
                  (d.operating_margin ?? 0) > 0
                    ? "text-zinc-300"
                    : "text-red-400"
                }`}
              >
                {formatPct(d.operating_margin)}
              </td>
              <td
                className={`text-right py-2.5 px-2 ${
                  (d.fcf_margin ?? 0) > 0 ? "text-zinc-300" : "text-red-400"
                }`}
              >
                {formatPct(d.fcf_margin)}
              </td>
              <td className="text-right py-2.5 px-2 text-white font-medium">
                {formatMultiple(d.ev_revenue)}
              </td>
              <td className="text-right py-2.5 px-2 text-zinc-300">
                {d.pe ? d.pe.toFixed(1) : "—"}
              </td>
              <td
                className={`text-right py-2.5 px-2 font-medium ${
                  (d.rule_of_40 ?? 0) >= 40
                    ? "text-emerald-400"
                    : "text-orange-400"
                }`}
              >
                {d.rule_of_40?.toFixed(1) ?? "—"}
              </td>
              <td
                className={`text-right py-2.5 px-2 ${
                  (d.stock_return_since_2020 ?? 0) > 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {d.stock_return_since_2020 !== null
                  ? `${d.stock_return_since_2020.toFixed(0)}%`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
