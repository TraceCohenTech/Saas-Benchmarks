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

/* ─── Distinct color palettes per section ─── */

const SECTOR_COLORS: Record<string, string> = {
  "Application SaaS": "#3b82f6",
  "Cloud Infrastructure": "#06b6d4",
  Cybersecurity: "#f59e0b",
  "Consumer Internet": "#ec4899",
  "E-Commerce": "#10b981",
  Fintech: "#a78bfa",
  "Legacy Tech": "#94a3b8",
  Semiconductors: "#ef4444",
};

// Warm gradient for Rule of 40 bars (top performers)
const R40_GRADIENT = [
  "#10b981", "#34d399", "#6ee7b7", "#a7f3d0",
  "#fbbf24", "#f59e0b", "#f97316", "#ef4444",
];

// Cool teal-to-blue for stock returns
const RETURN_COLORS_POS = "#22d3ee";
const RETURN_COLORS_NEG = "#f43f5e";

// Purple-to-pink for compression
const COMPRESS_NEG = "#e11d48";
const COMPRESS_POS = "#34d399";

/* ─── Shared tooltip style ─── */
const tooltipStyle = {
  backgroundColor: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: "8px",
  color: "#fff",
};

/* ─── Section wrapper ─── */
function Section({
  id,
  number,
  title,
  description,
  children,
}: {
  id: string;
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="scroll-mt-24"
    >
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-bold tracking-widest uppercase text-blue-400">
            {number}
          </span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-zinc-400 mt-1 max-w-3xl text-sm leading-relaxed">
          {description}
        </p>
      </div>
      {children}
    </motion.section>
  );
}

/* ─── Quick-nav pill ─── */
const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "compression", label: "Compression" },
  { id: "sectors", label: "Sectors" },
  { id: "growth-vs-val", label: "Growth vs Val" },
  { id: "rule-of-40", label: "Rule of 40" },
  { id: "returns", label: "Returns" },
  { id: "table", label: "Table" },
];

export default function Home() {
  const [selectedYear, setSelectedYear] = useState(getLatestYear());
  const [selectedSector, setSelectedSector] = useState<string>("All");

  const latestYear = getLatestYear();

  // KPI values
  const medianEvRev = getOverallMedian(latestYear, "ev_revenue");
  const medianEvRevPrior = getOverallMedian(latestYear - 1, "ev_revenue");
  const medianGrowth = getOverallMedian(latestYear, "revenue_growth");
  const medianR40 = getOverallMedian(latestYear, "rule_of_40");
  const medianOpMargin = getOverallMedian(latestYear, "operating_margin");
  const medianFcfMargin = getOverallMedian(latestYear, "fcf_margin");
  const companiesCount = data.filter(
    (d) => d.year === latestYear && d.revenue !== null
  ).length;

  const evRevDelta =
    medianEvRev && medianEvRevPrior
      ? (medianEvRev / medianEvRevPrior - 1) * 100
      : null;

  // Overall median EV/Rev trend
  const overallTrend = years
    .map((y) => ({ year: y, median: getOverallMedian(y, "ev_revenue") }))
    .filter((d) => d.median !== null);

  const evRevTimeSeries = getSectorEvRevenueTimeSeries();

  const scatterData = useMemo(() => {
    let d = getGrowthVsValuation(selectedYear);
    if (selectedSector !== "All")
      d = d.filter((r) => r.sector === selectedSector);
    return d;
  }, [selectedYear, selectedSector]);

  const r40Rankings = useMemo(() => {
    let d = getRuleOf40Rankings(selectedYear);
    if (selectedSector !== "All")
      d = d.filter((r) => r.sector === selectedSector);
    return d;
  }, [selectedYear, selectedSector]);

  const compressionData = useMemo(() => {
    let d = getMultipleCompression();
    if (selectedSector !== "All")
      d = d.filter((r) => r.sector === selectedSector);
    return d;
  }, [selectedSector]);

  const returns = getStockReturnRankings();

  // Sector metrics
  const sectorMetrics = sectors.map((s) => ({
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

  // Table
  const [sortField, setSortField] = useState<string>("ev_revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const tableData = useMemo(() => {
    let d = data.filter(
      (r) => r.year === selectedYear && r.revenue !== null
    );
    if (selectedSector !== "All")
      d = d.filter((r) => r.sector === selectedSector);
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

  const SortHeader = ({ field, label }: { field: string; label: string }) => (
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
    <div className="min-h-screen bg-[#09090b]">
      {/* ═══════════════════ HERO HEADER ═══════════════════ */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden border-b border-zinc-800"
      >
        {/* Gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-transparent to-cyan-950/30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Public Market Intelligence
            </p>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
              SaaS Valuation
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Benchmarks
              </span>
            </h1>
            <p className="text-zinc-400 mt-4 text-lg max-w-2xl leading-relaxed">
              Comprehensive financial dataset of {companiesCount}+ public technology companies.
              Revenue, margins, valuation multiples, and efficiency metrics from 2018 to present —
              tracking the full cycle from ZIRP to rate hikes to recovery.
            </p>
          </motion.div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-10">
            <AnimatedKPI
              label="Median EV / Revenue"
              value={medianEvRev ?? 0}
              suffix="x"
              decimals={1}
              delta={evRevDelta}
              deltaLabel="YoY"
              delay={0.3}
            />
            <AnimatedKPI
              label="Median Revenue Growth"
              value={medianGrowth ?? 0}
              suffix="%"
              decimals={1}
              delay={0.4}
            />
            <AnimatedKPI
              label="Median Rule of 40"
              value={medianR40 ?? 0}
              decimals={1}
              delay={0.5}
            />
            <AnimatedKPI
              label="Median Op. Margin"
              value={medianOpMargin ?? 0}
              suffix="%"
              decimals={1}
              delay={0.6}
            />
            <AnimatedKPI
              label="Median FCF Margin"
              value={medianFcfMargin ?? 0}
              suffix="%"
              decimals={1}
              delay={0.7}
            />
            <AnimatedKPI
              label="Companies Tracked"
              value={companiesCount}
              decimals={0}
              delay={0.8}
            />
          </div>
        </div>
      </motion.header>

      {/* ═══════════════════ STICKY NAV + FILTERS ═══════════════════ */}
      <div className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-4">
          {/* Quick-jump pills */}
          <nav className="flex gap-1.5 overflow-x-auto flex-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Filters */}
          <div className="flex gap-3 items-center">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded-lg px-3 py-1.5"
            >
              {years
                .filter((y) =>
                  data.some((d) => d.year === y && d.revenue !== null)
                )
                .map((y) => (
                  <option key={y} value={y}>
                    FY {y}
                  </option>
                ))}
            </select>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded-lg px-3 py-1.5"
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
      </div>

      {/* ═══════════════════ MAIN CONTENT ═══════════════════ */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-24">
        {/* ── Section 1: Overview — Valuation Compression ── */}
        <Section
          id="overview"
          number="01"
          title="The Valuation Compression Story"
          description="Median EV/Revenue multiples across 73 public tech companies from 2021 to present. The ZIRP era inflated SaaS multiples to historic highs — then rate hikes brought them crashing back to earth. This chart shows the magnitude and trajectory of that correction."
        >
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={overallTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="year" stroke="#71717a" />
                <YAxis stroke="#71717a" tickFormatter={(v) => `${v}x`} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [
                    `${Number(v).toFixed(1)}x`,
                    "Median EV/Rev",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="median"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#22d3ee", stroke: "#09090b", strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* ── Section 2: Compression by Sector ── */}
        <Section
          id="compression"
          number="02"
          title="Multiple Compression by Sector"
          description="How EV/Revenue multiples evolved across different technology sectors. Semiconductors and Cybersecurity held up best, while high-growth Cloud Infrastructure names saw the steepest declines. Each line represents the median multiple for companies in that sector."
        >
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={evRevTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="year" stroke="#71717a" />
                <YAxis stroke="#71717a" tickFormatter={(v) => `${v}x`} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => `${Number(v).toFixed(1)}x`}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "16px" }}
                  iconType="circle"
                />
                {sectors.map((s) => (
                  <Line
                    key={s}
                    type="monotone"
                    dataKey={s}
                    stroke={SECTOR_COLORS[s] || "#888"}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: SECTOR_COLORS[s] || "#888" }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Who compressed most vs expanded */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">
                Most Multiple Compression
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Biggest decline from peak EV/Revenue to current
              </p>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart
                  data={compressionData.slice(0, 12)}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    type="number"
                    stroke="#71717a"
                    tickFormatter={(v) => `${v}x`}
                  />
                  <YAxis
                    type="category"
                    dataKey="ticker"
                    stroke="#71717a"
                    width={55}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    content={({ payload }) => {
                      if (!payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                          <p className="text-white font-semibold">
                            {d.ticker} — {d.company}
                          </p>
                          <p className="text-zinc-400 text-xs">{d.sector}</p>
                          <p className="text-rose-400 mt-1">
                            Peak ({d.peak_year}):{" "}
                            {d.peak_ev_revenue.toFixed(1)}x
                          </p>
                          <p className="text-zinc-300">
                            Now ({d.latest_year}):{" "}
                            {d.latest_ev_revenue.toFixed(1)}x
                          </p>
                          <p className="text-rose-400 font-medium">
                            {d.compression.toFixed(1)}x (
                            {d.compression_pct?.toFixed(0)}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine x={0} stroke="#71717a" />
                  <Bar dataKey="compression" radius={[0, 6, 6, 0]}>
                    {compressionData.slice(0, 12).map((d) => (
                      <Cell
                        key={d.ticker}
                        fill={
                          d.compression < 0 ? COMPRESS_NEG : COMPRESS_POS
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">
                Multiple Expansion
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Companies that beat the compression and expanded multiples
              </p>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart
                  data={compressionData.slice(-12).reverse()}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    type="number"
                    stroke="#71717a"
                    tickFormatter={(v) => `${v}x`}
                  />
                  <YAxis
                    type="category"
                    dataKey="ticker"
                    stroke="#71717a"
                    width={55}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    content={({ payload }) => {
                      if (!payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                          <p className="text-white font-semibold">
                            {d.ticker} — {d.company}
                          </p>
                          <p className="text-zinc-400 text-xs">{d.sector}</p>
                          <p className="text-emerald-400 mt-1">
                            Peak ({d.peak_year}):{" "}
                            {d.peak_ev_revenue.toFixed(1)}x
                          </p>
                          <p className="text-zinc-300">
                            Now ({d.latest_year}):{" "}
                            {d.latest_ev_revenue.toFixed(1)}x
                          </p>
                          <p className="text-emerald-400 font-medium">
                            +{d.compression.toFixed(1)}x
                          </p>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine x={0} stroke="#71717a" />
                  <Bar dataKey="compression" radius={[0, 6, 6, 0]}>
                    {compressionData
                      .slice(-12)
                      .reverse()
                      .map((d) => (
                        <Cell
                          key={d.ticker}
                          fill={
                            d.compression >= 0 ? COMPRESS_POS : COMPRESS_NEG
                          }
                        />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* ── Section 3: Sector Benchmarks ── */}
        <Section
          id="sectors"
          number="03"
          title="Sector Benchmarks"
          description={`How each technology sector stacks up on key financial metrics for FY${selectedYear}. Median values across all companies in each sector — useful for comparing your own portfolio companies against public market benchmarks.`}
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* EV/Revenue bar */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Median EV / Revenue
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={sectorMetrics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    type="number"
                    stroke="#71717a"
                    tickFormatter={(v) => `${v}x`}
                  />
                  <YAxis
                    type="category"
                    dataKey="sector"
                    stroke="#71717a"
                    width={140}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => `${Number(v).toFixed(1)}x`}
                  />
                  <Bar dataKey="ev_revenue" radius={[0, 6, 6, 0]}>
                    {sectorMetrics.map((m) => (
                      <Cell
                        key={m.sector}
                        fill={SECTOR_COLORS[m.sector] || "#888"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Growth bar */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Median Revenue Growth
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={sectorMetrics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    type="number"
                    stroke="#71717a"
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="sector"
                    stroke="#71717a"
                    width={140}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => `${Number(v).toFixed(1)}%`}
                  />
                  <Bar dataKey="revenue_growth" radius={[0, 6, 6, 0]}>
                    {sectorMetrics.map((m) => (
                      <Cell
                        key={m.sector}
                        fill={SECTOR_COLORS[m.sector] || "#888"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Full sector table */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-400 border-b border-zinc-800">
                  <th className="text-left py-3 px-3">Sector</th>
                  <th className="text-right py-3 px-3">Companies</th>
                  <th className="text-right py-3 px-3">EV/Rev</th>
                  <th className="text-right py-3 px-3">Rev Growth</th>
                  <th className="text-right py-3 px-3">Op Margin</th>
                  <th className="text-right py-3 px-3">FCF Margin</th>
                  <th className="text-right py-3 px-3">Rule of 40</th>
                </tr>
              </thead>
              <tbody>
                {sectorMetrics.map((m) => (
                  <tr
                    key={m.sector}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: SECTOR_COLORS[m.sector],
                          }}
                        />
                        <span className="text-white font-medium">
                          {m.sector}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-3 text-zinc-300">
                      {m.companies}
                    </td>
                    <td className="text-right py-3 px-3 text-white font-semibold">
                      {formatMultiple(m.ev_revenue)}
                    </td>
                    <td className="text-right py-3 px-3 text-white">
                      {formatPct(m.revenue_growth)}
                    </td>
                    <td className="text-right py-3 px-3 text-white">
                      {formatPct(m.operating_margin)}
                    </td>
                    <td className="text-right py-3 px-3 text-white">
                      {formatPct(m.fcf_margin)}
                    </td>
                    <td
                      className={`text-right py-3 px-3 font-semibold ${
                        (m.rule_of_40 ?? 0) >= 40
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {m.rule_of_40?.toFixed(1) ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Section 4: Growth vs Valuation ── */}
        <Section
          id="growth-vs-val"
          number="04"
          title="Growth vs Valuation"
          description="The market's pricing of growth. Each dot is a company — x-axis is YoY revenue growth, y-axis is EV/Revenue multiple. In an efficient market, faster-growing companies should command higher multiples. Companies above the trend line may be overvalued; below it, potentially undervalued."
        >
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
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
                    fontSize: 12,
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
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                        <p className="text-white font-semibold">
                          {d.ticker} — {d.company}
                        </p>
                        <p className="text-zinc-400 text-xs">{d.sector}</p>
                        <p className="text-cyan-400 mt-1">
                          Growth: {d.revenue_growth.toFixed(1)}%
                        </p>
                        <p className="text-cyan-400">
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
                      fillOpacity={0.85}
                      r={7}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            {/* Sector legend */}
            <div className="flex flex-wrap gap-5 mt-5 justify-center">
              {sectors.map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-2 text-xs text-zinc-400"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: SECTOR_COLORS[s] }}
                  />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Section 5: Rule of 40 ── */}
        <Section
          id="rule-of-40"
          number="05"
          title="Rule of 40 Rankings"
          description="The Rule of 40 is the gold standard SaaS efficiency metric: Revenue Growth % + FCF Margin %. A score above 40 signals a healthy balance of growth and profitability. Top-tier companies often score 60+. Below 20 signals trouble — either growth has stalled or profitability is nowhere in sight."
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top 15 */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">
                Top 15 — Efficient Growers
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Highest Rule of 40 scores for FY{selectedYear}
              </p>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart
                  data={r40Rankings.slice(0, 15)}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" />
                  <YAxis
                    type="category"
                    dataKey="ticker"
                    stroke="#71717a"
                    width={55}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    content={({ payload }) => {
                      if (!payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                          <p className="text-white font-semibold">
                            {d.ticker} — {d.company}
                          </p>
                          <p className="text-zinc-400 text-xs">{d.sector}</p>
                          <p className="text-teal-400 mt-1 font-medium">
                            Rule of 40: {d.rule_of_40.toFixed(1)}
                          </p>
                          <p className="text-zinc-300">
                            Growth: {d.revenue_growth?.toFixed(1)}%
                          </p>
                          <p className="text-zinc-300">
                            FCF Margin:{" "}
                            {d.fcf_margin?.toFixed(1) ?? "—"}%
                          </p>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine
                    x={40}
                    stroke="#fbbf24"
                    strokeDasharray="4 4"
                    label={{
                      value: "40",
                      fill: "#fbbf24",
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="rule_of_40" radius={[0, 6, 6, 0]}>
                    {r40Rankings.slice(0, 15).map((d, i) => (
                      <Cell
                        key={d.ticker}
                        fill={
                          d.rule_of_40 >= 40
                            ? R40_GRADIENT[
                                Math.min(
                                  Math.floor(i / 4),
                                  R40_GRADIENT.length - 1
                                )
                              ]
                            : "#f97316"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom 15 */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">
                Bottom 15 — Struggling
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Lowest Rule of 40 scores — growth and margin both underwater
              </p>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart
                  data={r40Rankings.slice(-15).reverse()}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" />
                  <YAxis
                    type="category"
                    dataKey="ticker"
                    stroke="#71717a"
                    width={55}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    content={({ payload }) => {
                      if (!payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                          <p className="text-white font-semibold">
                            {d.ticker} — {d.company}
                          </p>
                          <p className="text-zinc-400 text-xs">{d.sector}</p>
                          <p className="text-rose-400 mt-1 font-medium">
                            Rule of 40: {d.rule_of_40.toFixed(1)}
                          </p>
                          <p className="text-zinc-300">
                            Growth: {d.revenue_growth?.toFixed(1)}%
                          </p>
                          <p className="text-zinc-300">
                            FCF Margin:{" "}
                            {d.fcf_margin?.toFixed(1) ?? "—"}%
                          </p>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine
                    x={40}
                    stroke="#fbbf24"
                    strokeDasharray="4 4"
                  />
                  <Bar dataKey="rule_of_40" radius={[0, 6, 6, 0]}>
                    {r40Rankings
                      .slice(-15)
                      .reverse()
                      .map((d) => (
                        <Cell
                          key={d.ticker}
                          fill={
                            d.rule_of_40 >= 40
                              ? "#10b981"
                              : d.rule_of_40 >= 20
                              ? "#f59e0b"
                              : "#ef4444"
                          }
                        />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* ── Section 6: Stock Returns ── */}
        <Section
          id="returns"
          number="06"
          title="Stock Performance Since 2020"
          description="Total stock price return from January 2020 to today. This captures the full pandemic cycle — the run-up, the crash, and the recovery. Some companies are up 500%+, while pandemic darlings like Zoom and Peloton gave back nearly everything."
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Best */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">
                Best Performers
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Biggest winners since Jan 2020
              </p>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={returns.slice(0, 15)} layout="vertical">
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
                    width={55}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    content={({ payload }) => {
                      if (!payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                          <p className="text-white font-semibold">
                            {d.ticker} — {d.company}
                          </p>
                          <p className="text-zinc-400 text-xs">{d.sector}</p>
                          <p className="text-cyan-400 mt-1 font-medium">
                            +{d.return_since_2020.toFixed(0)}%
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="return_since_2020"
                    radius={[0, 6, 6, 0]}
                    fill={RETURN_COLORS_POS}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Worst */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">
                Worst Performers
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Biggest losers since Jan 2020
              </p>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart
                  data={returns.slice(-15).reverse()}
                  layout="vertical"
                >
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
                    width={55}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    content={({ payload }) => {
                      if (!payload || !payload[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                          <p className="text-white font-semibold">
                            {d.ticker} — {d.company}
                          </p>
                          <p className="text-zinc-400 text-xs">{d.sector}</p>
                          <p className="text-rose-400 mt-1 font-medium">
                            {d.return_since_2020.toFixed(0)}%
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="return_since_2020" radius={[0, 6, 6, 0]}>
                    {returns
                      .slice(-15)
                      .reverse()
                      .map((d) => (
                        <Cell
                          key={d.ticker}
                          fill={
                            d.return_since_2020 >= 0
                              ? RETURN_COLORS_POS
                              : RETURN_COLORS_NEG
                          }
                        />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* ── Section 7: Full Company Table ── */}
        <Section
          id="table"
          number="07"
          title="Full Company Dataset"
          description={`Every company in the dataset for FY${selectedYear}. Click any column header to sort. All financial data from SEC filings via Yahoo Finance — revenue, margins, valuation multiples, and efficiency metrics in one view.`}
        >
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 overflow-x-auto">
            <p className="text-sm text-zinc-400 mb-4">
              {tableData.length} companies
              {selectedSector !== "All" ? ` in ${selectedSector}` : ""}
            </p>
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
                  <SortHeader
                    field="stock_return_since_2020"
                    label="Ret 2020"
                  />
                </tr>
              </thead>
              <tbody>
                {tableData.map((d) => (
                  <tr
                    key={d.ticker}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="py-2.5 px-2 text-white font-medium">
                      {d.ticker}
                    </td>
                    <td className="py-2.5 px-2 text-zinc-300 max-w-[150px] truncate">
                      {d.company}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${SECTOR_COLORS[d.sector]}15`,
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
                        (d.fcf_margin ?? 0) > 0
                          ? "text-zinc-300"
                          : "text-red-400"
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
                          : "text-amber-400"
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
          </div>
        </Section>
      </main>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-zinc-800 px-6 py-10 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-zinc-500">
            <p>Data sourced from Yahoo Finance via yfinance. Updated March 2026.</p>
            <p className="text-zinc-600 mt-1">
              73 companies &middot; 8 sectors &middot; 590 data points
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <a
              href="https://x.com/Trace_Cohen"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Twitter / X
            </a>
            <a
              href="mailto:t@nyvp.com"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              t@nyvp.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
