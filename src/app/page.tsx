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
  getMarginExpansion,
  getNeverDeservedIt,
  getSoundBites,
  formatBillions,
  formatPct,
  formatMultiple,
} from "@/lib/data";

/* ─── Color system — every section gets its own palette ─── */

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

const tooltipStyle = {
  backgroundColor: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: "8px",
  color: "#fff",
};

/* ─── Reusable components ─── */

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
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {title}
        </h2>
        <p className="text-zinc-400 mt-1 max-w-3xl text-sm leading-relaxed">
          {description}
        </p>
      </div>
      {children}
    </motion.section>
  );
}

// Bold callout card — the "sound bite" component
function Callout({
  stat,
  label,
  detail,
  color = "cyan",
  delay = 0,
}: {
  stat: string;
  label: string;
  detail?: string;
  color?: "cyan" | "rose" | "emerald" | "amber" | "blue";
  delay?: number;
}) {
  const colorMap = {
    cyan: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-400",
    rose: "from-rose-500/10 to-rose-500/5 border-rose-500/20 text-rose-400",
    emerald:
      "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
    amber:
      "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400",
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5`}
    >
      <p className={`text-3xl font-extrabold tracking-tight ${colorMap[color].split(" ").pop()}`}>
        {stat}
      </p>
      <p className="text-white font-semibold text-sm mt-1">{label}</p>
      {detail && (
        <p className="text-zinc-500 text-xs mt-1">{detail}</p>
      )}
    </motion.div>
  );
}

// Narrative interlude between sections
function Narrative({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="max-w-2xl mx-auto text-center py-12"
    >
      <p className="text-zinc-400 text-lg leading-relaxed italic">
        {children}
      </p>
    </motion.div>
  );
}

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "compression", label: "Compression" },
  { id: "efficiency", label: "Efficiency Era" },
  { id: "sectors", label: "Sectors" },
  { id: "growth-vs-val", label: "Growth vs Val" },
  { id: "never-deserved", label: "Never Deserved It" },
  { id: "rule-of-40", label: "Rule of 40" },
  { id: "returns", label: "Returns" },
  { id: "table", label: "Table" },
];

export default function Home() {
  const [selectedYear, setSelectedYear] = useState(getLatestYear());
  const [selectedSector, setSelectedSector] = useState<string>("All");

  const latestYear = getLatestYear();
  const bites = getSoundBites();

  // KPIs
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

  // Data
  const overallTrend = years
    .map((y) => ({ year: y, median: getOverallMedian(y, "ev_revenue") }))
    .filter((d) => d.median !== null);
  const evRevTimeSeries = getSectorEvRevenueTimeSeries();

  const scatterData = useMemo(() => {
    let d = getGrowthVsValuation(selectedYear);
    if (selectedSector !== "All") d = d.filter((r) => r.sector === selectedSector);
    return d;
  }, [selectedYear, selectedSector]);

  const r40Rankings = useMemo(() => {
    let d = getRuleOf40Rankings(selectedYear);
    if (selectedSector !== "All") d = d.filter((r) => r.sector === selectedSector);
    return d;
  }, [selectedYear, selectedSector]);

  const compressionData = useMemo(() => {
    let d = getMultipleCompression();
    if (selectedSector !== "All") d = d.filter((r) => r.sector === selectedSector);
    return d;
  }, [selectedSector]);

  const marginExpansion = getMarginExpansion();
  const neverDeserved = getNeverDeservedIt();
  const returns = getStockReturnRankings();

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
    if (sortField === field) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
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
      {/* ═══════════════════ HERO ═══════════════════ */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden border-b border-zinc-800"
      >
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
              Financial dataset of {companiesCount}+ public tech companies across 8 sectors.
              Revenue, margins, valuation multiples, and efficiency metrics from 2018 to present.
            </p>
          </motion.div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-10">
            <AnimatedKPI label="Median EV / Revenue" value={medianEvRev ?? 0} suffix="x" decimals={1} delta={evRevDelta} deltaLabel="YoY" delay={0.3} />
            <AnimatedKPI label="Median Revenue Growth" value={medianGrowth ?? 0} suffix="%" decimals={1} delay={0.4} />
            <AnimatedKPI label="Median Rule of 40" value={medianR40 ?? 0} decimals={1} delay={0.5} />
            <AnimatedKPI label="Median Op. Margin" value={medianOpMargin ?? 0} suffix="%" decimals={1} delay={0.6} />
            <AnimatedKPI label="Median FCF Margin" value={medianFcfMargin ?? 0} suffix="%" decimals={1} delay={0.7} />
            <AnimatedKPI label="Companies Tracked" value={companiesCount} decimals={0} delay={0.8} />
          </div>
        </div>
      </motion.header>

      {/* ═══════════════════ STICKY NAV ═══════════════════ */}
      <div className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-4">
          <nav className="flex gap-1.5 overflow-x-auto flex-1">
            {NAV_ITEMS.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors whitespace-nowrap">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex gap-3 items-center">
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded-lg px-3 py-1.5">
              {years.filter((y) => data.some((d) => d.year === y && d.revenue !== null)).map((y) => (
                <option key={y} value={y}>FY {y}</option>
              ))}
            </select>
            <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded-lg px-3 py-1.5">
              <option value="All">All Sectors</option>
              {sectors.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* ═══════════════════ CONTENT ═══════════════════ */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-20">

        {/* ── Sound Bite Cards — The Headlines ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Callout
            stat={`${bites.compressionPct}%`}
            label="Median multiple compression since 2021"
            detail={`Peak: ${bites.peakMedian?.toFixed(1)}x → Now: ${bites.currentMedian?.toFixed(1)}x`}
            color="rose"
            delay={0}
          />
          <Callout
            stat={`+${bites.bestStock?.stock_return_since_2020?.toFixed(0)}%`}
            label={`${bites.bestStock?.ticker} since Jan 2020`}
            detail={`${bites.bestStock?.company} — best performing stock`}
            color="emerald"
            delay={0.1}
          />
          <Callout
            stat={bites.bestR40?.rule_of_40?.toFixed(0) ?? "—"}
            label={`${bites.bestR40?.ticker} Rule of 40 score`}
            detail={`Highest efficiency score in the dataset`}
            color="cyan"
            delay={0.2}
          />
          <Callout
            stat={`${bites.above40}/${bites.totalR40}`}
            label="Companies pass the Rule of 40"
            detail={`${Math.round((bites.above40 / bites.totalR40) * 100)}% of companies hit the benchmark`}
            color="amber"
            delay={0.3}
          />
        </motion.div>

        {/* ══════ 01: VALUATION COMPRESSION ══════ */}
        <Section
          id="overview"
          number="01"
          title="The Valuation Compression Story"
          description="The ZIRP era inflated SaaS multiples to historic highs. Then rate hikes brought them crashing back to earth. This chart shows the median EV/Revenue multiple across all 73 companies — the rise, the crash, and where we are now."
        >
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={overallTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="year" stroke="#71717a" />
                <YAxis stroke="#71717a" tickFormatter={(v) => `${v}x`} />
                <Tooltip contentStyle={tooltipStyle}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [`${Number(v).toFixed(1)}x`, "Median EV/Rev"]} />
                <Line type="monotone" dataKey="median" stroke="#22d3ee" strokeWidth={3}
                  dot={{ r: 6, fill: "#22d3ee", stroke: "#09090b", strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Narrative>
          {`In 2021, the median public SaaS company traded at ${bites.peakMedian?.toFixed(1)}x revenue. Today it's ${bites.currentMedian?.toFixed(1)}x. That's a ${Math.abs(bites.compressionPct ?? 0)}% decline — the most dramatic valuation reset in cloud software history.`}
        </Narrative>

        {/* ══════ 02: COMPRESSION BY SECTOR ══════ */}
        <Section
          id="compression"
          number="02"
          title="Who Got Hit Hardest?"
          description="Not all sectors compressed equally. Some held their multiples, others fell off a cliff. Each line shows the median EV/Revenue for companies in that sector over time."
        >
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={evRevTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="year" stroke="#71717a" />
                <YAxis stroke="#71717a" tickFormatter={(v) => `${v}x`} />
                <Tooltip contentStyle={tooltipStyle}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => `${Number(v).toFixed(1)}x`} />
                <Legend wrapperStyle={{ paddingTop: "16px" }} iconType="circle" />
                {sectors.map((s) => (
                  <Line key={s} type="monotone" dataKey={s} stroke={SECTOR_COLORS[s] || "#888"}
                    strokeWidth={2.5} dot={{ r: 4, fill: SECTOR_COLORS[s] || "#888" }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Compression vs expansion side-by-side */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">Biggest Losers</h3>
              <p className="text-xs text-zinc-500 mb-4">Steepest decline from peak EV/Revenue</p>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={compressionData.slice(0, 12)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}x`} />
                  <YAxis type="category" dataKey="ticker" stroke="#71717a" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                      <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                      <p className="text-zinc-400 text-xs">{d.sector}</p>
                      <p className="text-rose-400 mt-1">Peak ({d.peak_year}): {d.peak_ev_revenue.toFixed(1)}x</p>
                      <p className="text-zinc-300">Now ({d.latest_year}): {d.latest_ev_revenue.toFixed(1)}x</p>
                      <p className="text-rose-400 font-medium">{d.compression.toFixed(1)}x ({d.compression_pct?.toFixed(0)}%)</p>
                    </div>);
                  }} />
                  <ReferenceLine x={0} stroke="#71717a" />
                  <Bar dataKey="compression" radius={[0, 6, 6, 0]}>
                    {compressionData.slice(0, 12).map((d) => (
                      <Cell key={d.ticker} fill={d.compression < 0 ? "#e11d48" : "#34d399"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">Beat the Compression</h3>
              <p className="text-xs text-zinc-500 mb-4">Companies that expanded multiples despite the downturn</p>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={compressionData.slice(-12).reverse()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}x`} />
                  <YAxis type="category" dataKey="ticker" stroke="#71717a" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                      <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                      <p className="text-zinc-400 text-xs">{d.sector}</p>
                      <p className="text-emerald-400 mt-1">+{d.compression.toFixed(1)}x expansion</p>
                    </div>);
                  }} />
                  <ReferenceLine x={0} stroke="#71717a" />
                  <Bar dataKey="compression" radius={[0, 6, 6, 0]}>
                    {compressionData.slice(-12).reverse().map((d) => (
                      <Cell key={d.ticker} fill={d.compression >= 0 ? "#34d399" : "#e11d48"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compression sound bite */}
          {bites.biggestDrop && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Callout
                stat={`${bites.biggestDrop.peak_ev_revenue.toFixed(0)}x → ${bites.biggestDrop.latest_ev_revenue.toFixed(0)}x`}
                label={`${bites.biggestDrop.ticker}'s multiple compression`}
                detail={`${bites.biggestDrop.company} — biggest absolute drop`}
                color="rose"
              />
              <Callout
                stat={`${compressionData.slice(-1)[0]?.compression?.toFixed(1)}x`}
                label={`${compressionData.slice(-1)[0]?.ticker} expanded the most`}
                detail="Biggest multiple expansion since peak"
                color="emerald"
              />
              <Callout
                stat={`${compressionData.filter(d => d.compression > 0).length}`}
                label="Companies expanded multiples"
                detail={`Out of ${compressionData.length} total — ${Math.round(compressionData.filter(d => d.compression > 0).length / compressionData.length * 100)}% beat the compression`}
                color="blue"
              />
            </div>
          )}
        </Section>

        <Narrative>
          {`${bites.biggestDrop?.ticker} went from ${bites.biggestDrop?.peak_ev_revenue.toFixed(0)}x revenue to ${bites.biggestDrop?.latest_ev_revenue.toFixed(0)}x. That's not a correction — that's a repricing of what growth is worth.`}
        </Narrative>

        {/* ══════ 03: EFFICIENCY ERA ══════ */}
        <Section
          id="efficiency"
          number="03"
          title="The Efficiency Era"
          description="Post-2022, the market stopped rewarding growth at all costs and started pricing profitability. These companies expanded operating margins the most since 2022 — many going from deeply negative to profitable. The 'Year of Efficiency' wasn't just a Meta memo."
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">Biggest Margin Improvers</h3>
              <p className="text-xs text-zinc-500 mb-4">Operating margin change from FY2022 to latest</p>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={marginExpansion.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}pp`} />
                  <YAxis type="category" dataKey="ticker" stroke="#71717a" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                      <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                      <p className="text-zinc-400 text-xs">{d.sector}</p>
                      <p className="text-zinc-300 mt-1">FY2022: {d.om_2022.toFixed(1)}%</p>
                      <p className="text-zinc-300">FY{d.latest_year}: {d.om_latest.toFixed(1)}%</p>
                      <p className="text-amber-400 font-medium">+{d.expansion.toFixed(0)}pp improvement</p>
                    </div>);
                  }} />
                  <Bar dataKey="expansion" radius={[0, 6, 6, 0]}>
                    {marginExpansion.slice(0, 15).map((d, i) => (
                      <Cell key={d.ticker} fill={i < 5 ? "#fbbf24" : i < 10 ? "#f59e0b" : "#d97706"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              {bites.marginLeader && (
                <Callout
                  stat={`+${bites.marginLeader.expansion.toFixed(0)}pp`}
                  label={`${bites.marginLeader.ticker} margin swing`}
                  detail={`From ${bites.marginLeader.om_2022.toFixed(0)}% to ${bites.marginLeader.om_latest.toFixed(0)}% operating margin`}
                  color="amber"
                />
              )}
              <Callout
                stat={`${marginExpansion.filter(d => d.om_latest > 0 && d.om_2022 < 0).length}`}
                label="Companies went from unprofitable to profitable"
                detail="Crossed from negative to positive operating margin since 2022"
                color="emerald"
              />
              <Callout
                stat={`${marginExpansion.filter(d => d.expansion > 20).length}`}
                label="Companies improved margins by 20+ points"
                detail="Massive operational restructuring across the sector"
                color="cyan"
              />

              {/* Mini leaderboard */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
                <h4 className="text-sm font-semibold text-white mb-3">Profitability Turnaround Leaders</h4>
                <div className="space-y-2">
                  {marginExpansion
                    .filter(d => d.om_latest > 0 && d.om_2022 < 0)
                    .slice(0, 6)
                    .map((d) => (
                      <div key={d.ticker} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SECTOR_COLORS[d.sector] }} />
                          <span className="text-white font-medium">{d.ticker}</span>
                          <span className="text-zinc-500 text-xs">{d.company}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-red-400 text-xs">{d.om_2022.toFixed(0)}%</span>
                          <span className="text-zinc-600">→</span>
                          <span className="text-emerald-400 text-xs font-medium">{d.om_latest.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Narrative>
          The efficiency era wasn&apos;t just talk. {marginExpansion.filter(d => d.om_latest > 0 && d.om_2022 < 0).length} companies went from burning cash to generating real profits in under 3 years.
        </Narrative>

        {/* ══════ 04: SECTOR BENCHMARKS ══════ */}
        <Section
          id="sectors"
          number="04"
          title="Sector Benchmarks"
          description={`How each technology sector stacks up on key metrics for FY${selectedYear}. These are the median values investors use to benchmark private companies against public comps.`}
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Median EV / Revenue</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={sectorMetrics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}x`} />
                  <YAxis type="category" dataKey="sector" stroke="#71717a" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => `${Number(v).toFixed(1)}x`} />
                  <Bar dataKey="ev_revenue" radius={[0, 6, 6, 0]}>
                    {sectorMetrics.map((m) => (<Cell key={m.sector} fill={SECTOR_COLORS[m.sector] || "#888"} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Median Revenue Growth</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={sectorMetrics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="sector" stroke="#71717a" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
                  <Bar dataKey="revenue_growth" radius={[0, 6, 6, 0]}>
                    {sectorMetrics.map((m) => (<Cell key={m.sector} fill={SECTOR_COLORS[m.sector] || "#888"} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-400 border-b border-zinc-800">
                  <th className="text-left py-3 px-3">Sector</th>
                  <th className="text-right py-3 px-3">Cos.</th>
                  <th className="text-right py-3 px-3">EV/Rev</th>
                  <th className="text-right py-3 px-3">Rev Growth</th>
                  <th className="text-right py-3 px-3">Op Margin</th>
                  <th className="text-right py-3 px-3">FCF Margin</th>
                  <th className="text-right py-3 px-3">Rule of 40</th>
                </tr>
              </thead>
              <tbody>
                {sectorMetrics.map((m) => (
                  <tr key={m.sector} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3 px-3"><div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: SECTOR_COLORS[m.sector] }} />
                      <span className="text-white font-medium">{m.sector}</span>
                    </div></td>
                    <td className="text-right py-3 px-3 text-zinc-300">{m.companies}</td>
                    <td className="text-right py-3 px-3 text-white font-semibold">{formatMultiple(m.ev_revenue)}</td>
                    <td className="text-right py-3 px-3 text-white">{formatPct(m.revenue_growth)}</td>
                    <td className="text-right py-3 px-3 text-white">{formatPct(m.operating_margin)}</td>
                    <td className="text-right py-3 px-3 text-white">{formatPct(m.fcf_margin)}</td>
                    <td className={`text-right py-3 px-3 font-semibold ${(m.rule_of_40 ?? 0) >= 40 ? "text-emerald-400" : "text-amber-400"}`}>
                      {m.rule_of_40?.toFixed(1) ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ══════ 05: GROWTH VS VALUATION ══════ */}
        <Section
          id="growth-vs-val"
          number="05"
          title="Growth vs Valuation"
          description="The fundamental question: does the market reward growth? Each dot is a company. Companies in the upper-right are high-growth and expensive. Lower-left are slow-growth and cheap. The real outliers — upper-left (expensive + slow) — might be overvalued."
        >
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
            <ResponsiveContainer width="100%" height={500}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" dataKey="revenue_growth" name="Revenue Growth" stroke="#71717a"
                  tickFormatter={(v) => `${v}%`}
                  label={{ value: "Revenue Growth %", position: "insideBottom", offset: -5, fill: "#71717a", fontSize: 12 }} />
                <YAxis type="number" dataKey="ev_revenue" name="EV/Revenue" stroke="#71717a"
                  tickFormatter={(v) => `${v}x`}
                  label={{ value: "EV / Revenue", angle: -90, position: "insideLeft", fill: "#71717a", fontSize: 12 }} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                    <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                    <p className="text-zinc-400 text-xs">{d.sector}</p>
                    <p className="text-cyan-400 mt-1">Growth: {d.revenue_growth.toFixed(1)}%</p>
                    <p className="text-cyan-400">EV/Rev: {d.ev_revenue.toFixed(1)}x</p>
                  </div>);
                }} />
                <Scatter data={scatterData}>
                  {scatterData.map((d, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[d.sector] || "#888"} fillOpacity={0.85} r={7} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-5 mt-5 justify-center">
              {sectors.map((s) => (
                <div key={s} className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SECTOR_COLORS[s] }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ══════ 06: NEVER DESERVED IT ══════ */}
        <Section
          id="never-deserved"
          number="06"
          title={`"Never Deserved It" Quadrant`}
          description="Peak EV/Revenue (2021-2022) on the x-axis vs total stock return since Jan 2020 on the y-axis. The danger zone is the bottom-right: companies that had sky-high multiples and have since destroyed shareholder value. Top-left companies were cheap and delivered returns."
        >
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
            <ResponsiveContainer width="100%" height={520}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" dataKey="peak_ev_revenue" name="Peak EV/Rev" stroke="#71717a"
                  tickFormatter={(v) => `${v}x`}
                  label={{ value: "Peak EV/Revenue (2021-22)", position: "insideBottom", offset: -5, fill: "#71717a", fontSize: 12 }} />
                <YAxis type="number" dataKey="stock_return" name="Stock Return" stroke="#71717a"
                  tickFormatter={(v) => `${v}%`}
                  label={{ value: "Stock Return Since 2020", angle: -90, position: "insideLeft", fill: "#71717a", fontSize: 12 }} />
                <ReferenceLine y={0} stroke="#71717a" strokeDasharray="3 3" />
                <ReferenceLine x={20} stroke="#71717a" strokeDasharray="3 3" />
                <Tooltip content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload;
                  const verdict = d.peak_ev_revenue > 20 && d.stock_return < 0
                    ? "Never deserved it" : d.peak_ev_revenue < 15 && d.stock_return > 100
                    ? "Hidden gem" : d.peak_ev_revenue > 20 && d.stock_return > 0
                    ? "Expensive but delivered" : "Fairly valued";
                  return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                    <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                    <p className="text-zinc-400 text-xs">{d.sector}</p>
                    <p className="text-zinc-300 mt-1">Peak: {d.peak_ev_revenue.toFixed(1)}x</p>
                    <p className={`${d.stock_return >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      Return: {d.stock_return >= 0 ? "+" : ""}{d.stock_return.toFixed(0)}%
                    </p>
                    <p className="text-amber-400 text-xs mt-1 font-medium">{verdict}</p>
                  </div>);
                }} />
                <Scatter data={neverDeserved}>
                  {neverDeserved.map((d, i) => (
                    <Cell key={i}
                      fill={
                        d.peak_ev_revenue > 20 && d.stock_return < 0 ? "#e11d48" :
                        d.peak_ev_revenue < 15 && d.stock_return > 100 ? "#22d3ee" :
                        SECTOR_COLORS[d.sector] || "#888"
                      }
                      fillOpacity={0.85} r={7} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-6 mt-4 justify-center text-xs">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-600" /> Never deserved it (expensive + negative returns)</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-400" /> Hidden gems (cheap + great returns)</div>
              <div className="flex items-center gap-2 text-zinc-500">Other companies colored by sector</div>
            </div>
          </div>

          {/* Shame list */}
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="bg-gradient-to-br from-rose-500/5 to-rose-500/10 border border-rose-500/20 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-rose-400 mb-3 uppercase tracking-wider">Never Deserved It</h4>
              <p className="text-xs text-zinc-500 mb-3">Traded at 20x+ revenue in 2021 and stock is now negative</p>
              <div className="space-y-2">
                {neverDeserved
                  .filter(d => d.peak_ev_revenue > 20 && d.stock_return < 0)
                  .sort((a, b) => a.stock_return - b.stock_return)
                  .slice(0, 8)
                  .map(d => (
                    <div key={d.ticker} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="text-white font-medium">{d.ticker}</span>
                        <span className="text-zinc-500 text-xs ml-2">Peak: {d.peak_ev_revenue.toFixed(0)}x</span>
                      </div>
                      <span className="text-rose-400 font-medium">{d.stock_return.toFixed(0)}%</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/5 to-cyan-500/10 border border-cyan-500/20 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">Hidden Gems</h4>
              <p className="text-xs text-zinc-500 mb-3">Traded below 15x and returned 100%+ since 2020</p>
              <div className="space-y-2">
                {neverDeserved
                  .filter(d => d.peak_ev_revenue < 15 && d.stock_return > 100)
                  .sort((a, b) => b.stock_return - a.stock_return)
                  .slice(0, 8)
                  .map(d => (
                    <div key={d.ticker} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="text-white font-medium">{d.ticker}</span>
                        <span className="text-zinc-500 text-xs ml-2">Peak: {d.peak_ev_revenue.toFixed(0)}x</span>
                      </div>
                      <span className="text-cyan-400 font-medium">+{d.stock_return.toFixed(0)}%</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Section>

        <Narrative>
          The market rewarded discipline. Companies that stayed below 15x revenue and focused on execution delivered the best long-term returns. The hype-cycle names that hit 40-50x? Most are still underwater.
        </Narrative>

        {/* ══════ 07: RULE OF 40 ══════ */}
        <Section
          id="rule-of-40"
          number="07"
          title="Rule of 40 Rankings"
          description="The gold standard SaaS metric: Revenue Growth % + FCF Margin %. Scores above 40 signal efficient growth. The best companies score 60+. This separates real businesses from 'growth at all costs' stories that burned out."
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">Top 15 — Elite Efficiency</h3>
              <p className="text-xs text-zinc-500 mb-4">Highest Rule of 40 scores</p>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={r40Rankings.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" />
                  <YAxis type="category" dataKey="ticker" stroke="#71717a" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                      <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                      <p className="text-zinc-400 text-xs">{d.sector}</p>
                      <p className="text-teal-400 mt-1 font-medium">Rule of 40: {d.rule_of_40.toFixed(1)}</p>
                      <p className="text-zinc-300">Growth: {d.revenue_growth?.toFixed(1)}%</p>
                      <p className="text-zinc-300">FCF Margin: {d.fcf_margin?.toFixed(1) ?? "—"}%</p>
                    </div>);
                  }} />
                  <ReferenceLine x={40} stroke="#fbbf24" strokeDasharray="4 4" label={{ value: "40", fill: "#fbbf24", fontSize: 11 }} />
                  <Bar dataKey="rule_of_40" radius={[0, 6, 6, 0]}>
                    {r40Rankings.slice(0, 15).map((d, i) => (
                      <Cell key={d.ticker} fill={i < 3 ? "#14b8a6" : i < 8 ? "#06b6d4" : "#0ea5e9"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">Bottom 15 — Red Flags</h3>
              <p className="text-xs text-zinc-500 mb-4">Growth + margins both underwater</p>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={r40Rankings.slice(-15).reverse()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" />
                  <YAxis type="category" dataKey="ticker" stroke="#71717a" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                      <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                      <p className="text-zinc-400 text-xs">{d.sector}</p>
                      <p className="text-rose-400 mt-1 font-medium">Rule of 40: {d.rule_of_40.toFixed(1)}</p>
                      <p className="text-zinc-300">Growth: {d.revenue_growth?.toFixed(1)}%</p>
                      <p className="text-zinc-300">FCF Margin: {d.fcf_margin?.toFixed(1) ?? "—"}%</p>
                    </div>);
                  }} />
                  <ReferenceLine x={40} stroke="#fbbf24" strokeDasharray="4 4" />
                  <Bar dataKey="rule_of_40" radius={[0, 6, 6, 0]}>
                    {r40Rankings.slice(-15).reverse().map((d) => (
                      <Cell key={d.ticker} fill={d.rule_of_40 >= 40 ? "#10b981" : d.rule_of_40 >= 20 ? "#f59e0b" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* ══════ 08: STOCK RETURNS ══════ */}
        <Section
          id="returns"
          number="08"
          title="The Scoreboard: Stock Performance"
          description="Total stock return from January 2020 to today. This captures the full pandemic cycle — the run-up, the crash, and who actually came out ahead. The gap between winners and losers is staggering."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Callout stat={`+${returns[0]?.return_since_2020.toFixed(0)}%`} label={`${returns[0]?.ticker} — #1 performer`} detail={returns[0]?.company} color="emerald" />
            <Callout stat={`${returns[returns.length - 1]?.return_since_2020.toFixed(0)}%`} label={`${returns[returns.length - 1]?.ticker} — worst performer`} detail={returns[returns.length - 1]?.company} color="rose" />
            <Callout stat={`${returns.filter(d => d.return_since_2020 > 0).length}`} label="Positive since 2020" detail={`${Math.round(returns.filter(d => d.return_since_2020 > 0).length / returns.length * 100)}% of companies`} color="cyan" />
            <Callout stat={`${Math.round(returns.reduce((s, d) => s + d.return_since_2020, 0) / returns.length)}%`} label="Average return" detail="Across all companies in dataset" color="blue" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">Best 15</h3>
              <p className="text-xs text-zinc-500 mb-4">Winners since Jan 2020</p>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={returns.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="ticker" stroke="#71717a" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                      <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                      <p className="text-zinc-400 text-xs">{d.sector}</p>
                      <p className="text-cyan-400 mt-1 font-medium">+{d.return_since_2020.toFixed(0)}%</p>
                    </div>);
                  }} />
                  <Bar dataKey="return_since_2020" radius={[0, 6, 6, 0]} fill="#22d3ee" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">Worst 15</h3>
              <p className="text-xs text-zinc-500 mb-4">Losers since Jan 2020</p>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={returns.slice(-15).reverse()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="ticker" stroke="#71717a" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                      <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                      <p className="text-zinc-400 text-xs">{d.sector}</p>
                      <p className="text-rose-400 mt-1 font-medium">{d.return_since_2020.toFixed(0)}%</p>
                    </div>);
                  }} />
                  <Bar dataKey="return_since_2020" radius={[0, 6, 6, 0]}>
                    {returns.slice(-15).reverse().map((d) => (
                      <Cell key={d.ticker} fill={d.return_since_2020 >= 0 ? "#22d3ee" : "#f43f5e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* ══════ 09: FULL TABLE ══════ */}
        <Section
          id="table"
          number="09"
          title="Full Company Dataset"
          description={`Every company in the dataset for FY${selectedYear}. Click any column header to sort. This is the raw data behind every chart above — revenue, margins, multiples, and efficiency metrics in one searchable view.`}
        >
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 overflow-x-auto">
            <p className="text-sm text-zinc-400 mb-4">{tableData.length} companies{selectedSector !== "All" ? ` in ${selectedSector}` : ""}</p>
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
                  <tr key={d.ticker} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                    <td className="py-2.5 px-2 text-white font-medium">{d.ticker}</td>
                    <td className="py-2.5 px-2 text-zinc-300 max-w-[150px] truncate">{d.company}</td>
                    <td className="py-2.5 px-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${SECTOR_COLORS[d.sector]}15`, color: SECTOR_COLORS[d.sector] }}>
                        {d.sector}
                      </span>
                    </td>
                    <td className="text-right py-2.5 px-2 text-zinc-300">{formatBillions(d.revenue)}</td>
                    <td className={`text-right py-2.5 px-2 font-medium ${(d.revenue_growth ?? 0) >= 20 ? "text-emerald-400" : (d.revenue_growth ?? 0) >= 0 ? "text-zinc-300" : "text-red-400"}`}>
                      {formatPct(d.revenue_growth)}
                    </td>
                    <td className="text-right py-2.5 px-2 text-zinc-300">{formatPct(d.gross_margin)}</td>
                    <td className={`text-right py-2.5 px-2 ${(d.operating_margin ?? 0) > 0 ? "text-zinc-300" : "text-red-400"}`}>
                      {formatPct(d.operating_margin)}
                    </td>
                    <td className={`text-right py-2.5 px-2 ${(d.fcf_margin ?? 0) > 0 ? "text-zinc-300" : "text-red-400"}`}>
                      {formatPct(d.fcf_margin)}
                    </td>
                    <td className="text-right py-2.5 px-2 text-white font-medium">{formatMultiple(d.ev_revenue)}</td>
                    <td className="text-right py-2.5 px-2 text-zinc-300">{d.pe ? d.pe.toFixed(1) : "—"}</td>
                    <td className={`text-right py-2.5 px-2 font-medium ${(d.rule_of_40 ?? 0) >= 40 ? "text-emerald-400" : "text-amber-400"}`}>
                      {d.rule_of_40?.toFixed(1) ?? "—"}
                    </td>
                    <td className={`text-right py-2.5 px-2 ${(d.stock_return_since_2020 ?? 0) > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {d.stock_return_since_2020 !== null ? `${d.stock_return_since_2020.toFixed(0)}%` : "—"}
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
            <p className="text-zinc-600 mt-1">73 companies &middot; 8 sectors &middot; 590 data points</p>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="https://x.com/Trace_Cohen" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">Twitter / X</a>
            <a href="mailto:t@nyvp.com" className="text-zinc-400 hover:text-white transition-colors">t@nyvp.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
