"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import AnimatedKPI from "@/components/AnimatedKPI";
import {
  data, sectors, years, tickers,
  getLatestYear, getOverallMedian, getSectorMedian,
  getSectorEvRevenueTimeSeries, getGrowthVsValuation,
  getRuleOf40Rankings, getMultipleCompression, getStockReturnRankings,
  getMarginExpansion, getSoundBites,
  getHeatmapData, getAIPremiumData, getAIvsNonAITimeSeries,
  getKeyTakeaways, getSectorBestInClass,
  getCompanyTimeSeries, getCompanyDetails,
  formatBillions, formatPct, formatMultiple,
} from "@/lib/data";

/* ─── Colors ─── */
const SECTOR_COLORS: Record<string, string> = {
  "Application SaaS": "#3b82f6", "Cloud Infrastructure": "#06b6d4",
  Cybersecurity: "#f59e0b", "Consumer Internet": "#ec4899",
  "E-Commerce": "#10b981", Fintech: "#a78bfa",
  "Legacy Tech": "#94a3b8", Semiconductors: "#ef4444",
};
const COMPARE_COLORS = ["#22d3ee", "#f472b6", "#a3e635"];
const tooltipStyle = { backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", color: "#fff" };

/* ─── Reusable ─── */
function Section({ id, number, title, description, children }: {
  id: string; number: string; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <motion.section id={id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }} className="scroll-mt-24">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-bold tracking-widest uppercase text-blue-400">{number}</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-zinc-400 mt-1 max-w-3xl text-sm leading-relaxed">{description}</p>
      </div>
      {children}
    </motion.section>
  );
}

function Callout({ stat, label, detail, color = "cyan", delay = 0 }: {
  stat: string; label: string; detail?: string; color?: "cyan" | "rose" | "emerald" | "amber" | "blue"; delay?: number;
}) {
  const cm: Record<string, string> = {
    cyan: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-400",
    rose: "from-rose-500/10 to-rose-500/5 border-rose-500/20 text-rose-400",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400",
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-400",
  };
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }} transition={{ duration: 0.4, delay }}
      className={`bg-gradient-to-br ${cm[color]} border rounded-2xl p-5`}>
      <p className={`text-3xl font-extrabold tracking-tight`}>{stat}</p>
      <p className="text-white font-semibold text-sm mt-1">{label}</p>
      {detail && <p className="text-zinc-500 text-xs mt-1">{detail}</p>}
    </motion.div>
  );
}

function Narrative({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
      className="max-w-2xl mx-auto text-center py-10">
      <p className="text-zinc-400 text-lg leading-relaxed italic">{children}</p>
    </motion.div>
  );
}

/* ─── Heatmap color helper ─── */
function heatmapColor(val: number | null): string {
  if (val === null) return "transparent";
  if (val > 40) return "#991b1b";
  if (val > 25) return "#dc2626";
  if (val > 15) return "#f97316";
  if (val > 10) return "#eab308";
  if (val > 7) return "#84cc16";
  if (val > 4) return "#22d3ee";
  return "#3b82f6";
}


export default function Home() {
  const selectedYear = getLatestYear();
  const selectedSector = "All";
  const [comp1, setComp1] = useState("NVDA");
  const [comp2, setComp2] = useState("CRM");
  const [comp3, setComp3] = useState("CRWD");
  const [tableSearch, setTableSearch] = useState("");
  const [heatmapSort, setHeatmapSort] = useState<{ field: "ticker" | number; dir: "asc" | "desc" }>({ field: "ticker", dir: "asc" });

  const latestYear = getLatestYear();
  const bites = getSoundBites();
  const takeaways = getKeyTakeaways();

  const medianEvRev = getOverallMedian(latestYear, "ev_revenue");
  const medianEvRevPrior = getOverallMedian(latestYear - 1, "ev_revenue");
  const medianGrowth = getOverallMedian(latestYear, "revenue_growth");
  const medianR40 = getOverallMedian(latestYear, "rule_of_40");
  const medianOpMargin = getOverallMedian(latestYear, "operating_margin");
  const medianFcfMargin = getOverallMedian(latestYear, "fcf_margin");
  const companiesCount = data.filter((d) => d.year === latestYear && d.revenue !== null).length;
  const evRevDelta = medianEvRev && medianEvRevPrior ? (medianEvRev / medianEvRevPrior - 1) * 100 : null;

  const overallTrend = years.map((y) => ({ year: y, median: getOverallMedian(y, "ev_revenue") })).filter((d) => d.median !== null);
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
  const returns = getStockReturnRankings();
  const heatmapData = getHeatmapData();
  const aiPremium = getAIPremiumData(selectedYear);
  const aiTimeSeries = getAIvsNonAITimeSeries();
  const bestInClass = getSectorBestInClass(selectedYear);
  const heatmapYears = years.filter((y) => y !== 2021 && y !== 2026 && data.some((d) => d.year === y && d.ev_revenue !== null));

  const sortedHeatmapData = useMemo(() => {
    const sorted = [...heatmapData];
    if (heatmapSort.field === "ticker") {
      sorted.sort((a, b) => heatmapSort.dir === "asc" ? a.ticker.localeCompare(b.ticker) : b.ticker.localeCompare(a.ticker));
    } else {
      const yr = heatmapSort.field;
      sorted.sort((a, b) => {
        const aV = a.years[yr] ?? -Infinity;
        const bV = b.years[yr] ?? -Infinity;
        return heatmapSort.dir === "desc" ? bV - aV : aV - bV;
      });
    }
    return sorted;
  }, [heatmapData, heatmapSort]);

  const sectorMetrics = sectors.map((s) => ({
    sector: s,
    ev_revenue: getSectorMedian(s, selectedYear, "ev_revenue"),
    revenue_growth: getSectorMedian(s, selectedYear, "revenue_growth"),
    operating_margin: getSectorMedian(s, selectedYear, "operating_margin"),
    fcf_margin: getSectorMedian(s, selectedYear, "fcf_margin"),
    rule_of_40: getSectorMedian(s, selectedYear, "rule_of_40"),
    companies: data.filter((d) => d.sector === s && d.year === selectedYear && d.revenue !== null).length,
  }));

  // Company comparison
  const compTickers = [comp1, comp2, comp3].filter(Boolean);
  const compTimeSeries = useMemo(() => {
    const allYears = Array.from(new Set(
      compTickers.flatMap((t) => getCompanyTimeSeries(t).map((d) => d.year))
    )).sort();
    return allYears.map((y) => {
      const row: Record<string, number | null> = { year: y };
      compTickers.forEach((t) => {
        const d = getCompanyTimeSeries(t).find((r) => r.year === y);
        row[t] = d?.ev_revenue ?? null;
      });
      return row;
    });
  }, [comp1, comp2, comp3]); // eslint-disable-line react-hooks/exhaustive-deps

  // Table
  const [sortField, setSortField] = useState<string>("ev_revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const tableData = useMemo(() => {
    let d = data.filter((r) => r.year === selectedYear && r.revenue !== null);
    if (selectedSector !== "All") d = d.filter((r) => r.sector === selectedSector);
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      d = d.filter((r) => r.ticker.toLowerCase().includes(q) || r.company.toLowerCase().includes(q));
    }
    d.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aV = (a as any)[sortField] as number | null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bV = (b as any)[sortField] as number | null;
      if (aV === null) return 1; if (bV === null) return -1;
      return sortDir === "desc" ? bV - aV : aV - bV;
    });
    return d;
  }, [selectedYear, selectedSector, sortField, sortDir, tableSearch]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  };
  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <th className="text-right py-3 px-2 cursor-pointer hover:text-white transition-colors whitespace-nowrap"
      onClick={() => handleSort(field)}>
      {label}{sortField === field && <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>}
    </th>
  );


  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* ═══ HERO ═══ */}
      <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-transparent to-cyan-950/30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">Public Market Intelligence</p>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
              SaaS Valuation<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">Benchmarks</span>
            </h1>
            <p className="text-zinc-400 mt-4 text-lg max-w-2xl leading-relaxed">
              Financial dataset of {companiesCount}+ public tech companies across 8 sectors. Revenue, margins, valuation multiples, and efficiency metrics from 2022 to present.
            </p>
          </motion.div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-20">

        {/* ═══ KEY TAKEAWAYS ═══ */}
        <Section id="takeaways" number="00" title="Key Takeaways"
          description="Auto-generated insights from the dataset. These update dynamically as the data changes.">
          <div className="grid md:grid-cols-2 gap-3">
            {takeaways.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="flex gap-3 items-start bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-4">
                <span className="text-blue-400 font-bold text-sm mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-zinc-300 text-sm leading-relaxed">{t}</p>
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
            <AnimatedKPI label="Median EV / Revenue" value={medianEvRev ?? 0} suffix="x" decimals={1} delta={evRevDelta} deltaLabel="YoY" delay={0.1} />
            <AnimatedKPI label="Median Revenue Growth" value={medianGrowth ?? 0} suffix="%" decimals={1} delay={0.15} />
            <AnimatedKPI label="Median Rule of 40" value={medianR40 ?? 0} decimals={1} delay={0.2} />
            <AnimatedKPI label="Median Op. Margin" value={medianOpMargin ?? 0} suffix="%" decimals={1} delay={0.25} />
            <AnimatedKPI label="Median FCF Margin" value={medianFcfMargin ?? 0} suffix="%" decimals={1} delay={0.3} />
            <AnimatedKPI label="Companies Tracked" value={companiesCount} decimals={0} delay={0.35} />
          </div>
        </Section>

        {/* ═══ SOUND BITES ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Callout stat={`${bites.compressionPct}%`} label="Median multiple compression since 2021"
            detail={`Peak: ${bites.peakMedian?.toFixed(1)}x → Now: ${bites.currentMedian?.toFixed(1)}x`} color="rose" />
          <Callout stat={`+${bites.bestStock?.stock_return_since_2020?.toFixed(0)}%`}
            label={`${bites.bestStock?.ticker} since Jan 2020`} detail="Best performing stock" color="emerald" delay={0.1} />
          <Callout stat={bites.bestR40?.rule_of_40?.toFixed(0) ?? "—"}
            label={`${bites.bestR40?.ticker} Rule of 40`} detail="Highest efficiency score" color="cyan" delay={0.2} />
          <Callout stat={`${bites.above40}/${bites.totalR40}`}
            label="Pass the Rule of 40" detail={`${Math.round((bites.above40 / bites.totalR40) * 100)}% hit the benchmark`} color="amber" delay={0.3} />
        </div>

        {/* ═══ 01: COMPRESSION STORY ═══ */}
        <Section id="overview" number="01" title="The Valuation Compression Story"
          description="Median EV/Revenue multiple across all 73 companies. Key market events annotated. The ZIRP era inflated multiples to historic highs — rate hikes brought them crashing back.">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={overallTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="year" stroke="#71717a" />
                <YAxis stroke="#71717a" tickFormatter={(v) => `${v}x`} />
                <Tooltip contentStyle={tooltipStyle}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [`${Number(v).toFixed(1)}x`, "Median EV/Rev"]} />
                {/* Event annotations */}
                <ReferenceLine x={2021} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "ZIRP Peak", fill: "#f59e0b", fontSize: 10, position: "top" }} />
                <ReferenceLine x={2022} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Rate Hikes", fill: "#ef4444", fontSize: 10, position: "top" }} />
                <ReferenceLine x={2023} stroke="#a78bfa" strokeDasharray="4 4" label={{ value: "ChatGPT / SVB", fill: "#a78bfa", fontSize: 10, position: "top" }} />
                <ReferenceLine x={2024} stroke="#22d3ee" strokeDasharray="4 4" label={{ value: "AI Surge", fill: "#22d3ee", fontSize: 10, position: "top" }} />
                <Line type="monotone" dataKey="median" stroke="#22d3ee" strokeWidth={3}
                  dot={{ r: 6, fill: "#22d3ee", stroke: "#09090b", strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Narrative>
          {`In 2021, the median public SaaS company traded at ${bites.peakMedian?.toFixed(1)}x revenue. Today it's ${bites.currentMedian?.toFixed(1)}x. A ${Math.abs(bites.compressionPct ?? 0)}% decline — the most dramatic valuation reset in cloud software history.`}
        </Narrative>

        {/* ═══ 02: SECTOR COMPRESSION LINES ═══ */}
        <Section id="compression" number="02" title="Compression by Sector"
          description="Not all sectors compressed equally. Each line shows the median EV/Revenue for companies in that sector.">
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
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">Biggest Losers</h3>
              <p className="text-xs text-zinc-500 mb-4">Steepest decline from peak EV/Revenue</p>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={compressionData.slice(0, 12)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}x`} />
                  <YAxis type="category" dataKey="ticker" stroke="#71717a" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} content={({ payload }) => {
                    if (!payload?.[0]) return null; const d = payload[0].payload;
                    return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                      <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                      <p className="text-zinc-400 text-xs">{d.sector}</p>
                      <p className="text-rose-400 mt-1">Peak: {d.peak_ev_revenue.toFixed(1)}x → Now: {d.latest_ev_revenue.toFixed(1)}x</p>
                    </div>);
                  }} />
                  <Bar dataKey="compression" radius={[0, 6, 6, 0]}>
                    {compressionData.slice(0, 12).map((d) => (<Cell key={d.ticker} fill={d.compression < 0 ? "#e11d48" : "#34d399"} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">Beat the Compression</h3>
              <p className="text-xs text-zinc-500 mb-4">Companies that expanded multiples</p>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={compressionData.slice(-12).reverse()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}x`} />
                  <YAxis type="category" dataKey="ticker" stroke="#71717a" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} content={({ payload }) => {
                    if (!payload?.[0]) return null; const d = payload[0].payload;
                    return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                      <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                      <p className="text-emerald-400 mt-1">+{d.compression.toFixed(1)}x expansion</p>
                    </div>);
                  }} />
                  <Bar dataKey="compression" radius={[0, 6, 6, 0]}>
                    {compressionData.slice(-12).reverse().map((d) => (<Cell key={d.ticker} fill={d.compression >= 0 ? "#34d399" : "#e11d48"} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* ═══ 03: AI PREMIUM ═══ */}
        <Section id="ai-premium" number="03" title="The AI Premium"
          description="Companies riding the AI wave trade at a significant premium. We split the universe into AI beneficiaries (NVDA, CRWD, DDOG, SNOW, MSFT, etc.) vs everyone else to quantify the gap.">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Callout stat={`${aiPremium.aiMedianEvRev?.toFixed(1)}x`} label="AI median EV/Revenue" detail={`${aiPremium.aiCount} companies`} color="cyan" />
            <Callout stat={`${aiPremium.nonAiMedianEvRev?.toFixed(1)}x`} label="Non-AI median EV/Revenue" detail={`${aiPremium.nonAiCount} companies`} color="blue" />
            <Callout stat={aiPremium.aiMedianEvRev && aiPremium.nonAiMedianEvRev
              ? `${Math.round(((aiPremium.aiMedianEvRev / aiPremium.nonAiMedianEvRev) - 1) * 100)}%`
              : "—"} label="AI Premium" detail="How much more the market pays for AI exposure" color="emerald" />
            <Callout stat={aiPremium.aiMedianReturn && aiPremium.nonAiMedianReturn
              ? `+${(aiPremium.aiMedianReturn - aiPremium.nonAiMedianReturn).toFixed(0)}pp`
              : "—"} label="Return gap since 2020" detail="AI vs Non-AI median stock return" color="amber" />
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">AI vs Non-AI Median EV/Revenue Over Time</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={aiTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="year" stroke="#71717a" />
                <YAxis stroke="#71717a" tickFormatter={(v) => `${v}x`} />
                <Tooltip contentStyle={tooltipStyle}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => `${Number(v).toFixed(1)}x`} />
                <Legend />
                <Line type="monotone" dataKey="ai" name="AI Beneficiaries" stroke="#22d3ee" strokeWidth={3} dot={{ r: 5 }} connectNulls />
                <Line type="monotone" dataKey="nonAi" name="Non-AI" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* ═══ 04: EFFICIENCY ERA ═══ */}
        <Section id="efficiency" number="04" title="The Efficiency Era"
          description="Post-2022, the market stopped rewarding growth at all costs. These companies expanded operating margins the most — many going from deeply negative to profitable.">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">Biggest Margin Improvers</h3>
              <p className="text-xs text-zinc-500 mb-4">Op margin change from FY2022 to latest</p>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={marginExpansion.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}pp`} />
                  <YAxis type="category" dataKey="ticker" stroke="#71717a" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} content={({ payload }) => {
                    if (!payload?.[0]) return null; const d = payload[0].payload;
                    return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                      <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                      <p className="text-zinc-300 mt-1">FY2022: {d.om_2022.toFixed(1)}% → FY{d.latest_year}: {d.om_latest.toFixed(1)}%</p>
                      <p className="text-amber-400 font-medium">+{d.expansion.toFixed(0)}pp</p>
                    </div>);
                  }} />
                  <Bar dataKey="expansion" radius={[0, 6, 6, 0]}>
                    {marginExpansion.slice(0, 15).map((d, i) => (<Cell key={d.ticker} fill={i < 5 ? "#fbbf24" : i < 10 ? "#f59e0b" : "#d97706"} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {bites.marginLeader && <Callout stat={`+${bites.marginLeader.expansion.toFixed(0)}pp`}
                label={`${bites.marginLeader.ticker} margin swing`}
                detail={`From ${bites.marginLeader.om_2022.toFixed(0)}% to ${bites.marginLeader.om_latest.toFixed(0)}%`} color="amber" />}
              <Callout stat={`${marginExpansion.filter(d => d.om_latest > 0 && d.om_2022 < 0).length}`}
                label="Went from unprofitable to profitable" detail="Crossed 0% op margin since 2022" color="emerald" />
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
                <h4 className="text-sm font-semibold text-white mb-3">Profitability Turnaround Leaders</h4>
                <div className="space-y-2">
                  {marginExpansion.filter(d => d.om_latest > 0 && d.om_2022 < 0).slice(0, 6).map((d) => (
                    <div key={d.ticker} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SECTOR_COLORS[d.sector] }} />
                        <span className="text-white font-medium">{d.ticker}</span>
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

        {/* ═══ 05: SECTOR BENCHMARKS ═══ */}
        <Section id="sectors" number="05" title="Sector Benchmarks"
          description={`Median metrics by sector for FY${selectedYear}. Use these to benchmark private companies against public comps.`}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Median EV / Revenue</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={sectorMetrics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}x`} />
                  <YAxis type="category" dataKey="sector" stroke="#71717a" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="sector" stroke="#71717a" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
                  <Bar dataKey="revenue_growth" radius={[0, 6, 6, 0]}>
                    {sectorMetrics.map((m) => (<Cell key={m.sector} fill={SECTOR_COLORS[m.sector] || "#888"} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Best in Class */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Best in Class by Sector</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {bestInClass.map((s) => (
                <div key={s.sector} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SECTOR_COLORS[s.sector] }} />
                    <span className="text-white text-sm font-semibold">{s.sector}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {s.bestEvRev && <div className="flex justify-between"><span className="text-zinc-500">Highest EV/Rev</span><span className="text-white font-medium">{s.bestEvRev.ticker} ({s.bestEvRev.value.toFixed(1)}x)</span></div>}
                    {s.bestGrowth && <div className="flex justify-between"><span className="text-zinc-500">Fastest Growth</span><span className="text-emerald-400 font-medium">{s.bestGrowth.ticker} ({s.bestGrowth.value.toFixed(0)}%)</span></div>}
                    {s.bestR40 && <div className="flex justify-between"><span className="text-zinc-500">Best Ro40</span><span className="text-cyan-400 font-medium">{s.bestR40.ticker} ({s.bestR40.value.toFixed(0)})</span></div>}
                    {s.bestMargin && <div className="flex justify-between"><span className="text-zinc-500">Best Margin</span><span className="text-amber-400 font-medium">{s.bestMargin.ticker} ({s.bestMargin.value.toFixed(0)}%)</span></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sector table */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-zinc-400 border-b border-zinc-800">
                <th className="text-left py-3 px-3">Sector</th><th className="text-right py-3 px-3">Cos.</th>
                <th className="text-right py-3 px-3">EV/Rev</th><th className="text-right py-3 px-3">Rev Growth</th>
                <th className="text-right py-3 px-3">Op Margin</th><th className="text-right py-3 px-3">FCF Margin</th>
                <th className="text-right py-3 px-3">Rule of 40</th>
              </tr></thead>
              <tbody>{sectorMetrics.map((m) => (
                <tr key={m.sector} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
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
                    {m.rule_of_40?.toFixed(1) ?? "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Section>

        {/* ═══ 06: GROWTH VS VALUATION ═══ */}
        <Section id="growth-vs-val" number="06" title="Growth vs Valuation"
          description="Does the market reward growth? Each dot is a company. Upper-right = high-growth + expensive. Lower-left = slow-growth + cheap. Upper-left outliers may be overvalued.">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
            <ResponsiveContainer width="100%" height={500}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" dataKey="revenue_growth" stroke="#71717a" tickFormatter={(v) => `${v}%`}
                  label={{ value: "Revenue Growth %", position: "insideBottom", offset: -5, fill: "#71717a", fontSize: 12 }} />
                <YAxis type="number" dataKey="ev_revenue" stroke="#71717a" tickFormatter={(v) => `${v}x`}
                  label={{ value: "EV / Revenue", angle: -90, position: "insideLeft", fill: "#71717a", fontSize: 12 }} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.[0]) return null; const d = payload[0].payload;
                  return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                    <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                    <p className="text-zinc-400 text-xs">{d.sector}</p>
                    <p className="text-cyan-400 mt-1">Growth: {d.revenue_growth.toFixed(1)}% · EV/Rev: {d.ev_revenue.toFixed(1)}x</p>
                  </div>);
                }} />
                <Scatter data={scatterData}>
                  {scatterData.map((d, i) => (<Cell key={i} fill={SECTOR_COLORS[d.sector] || "#888"} fillOpacity={0.85} r={7} />))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-5 mt-4 justify-center">
              {sectors.map((s) => (<div key={s} className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SECTOR_COLORS[s] }} />{s}
              </div>))}
            </div>
          </div>
        </Section>

        {/* ═══ 07: RULE OF 40 ═══ */}
        <Section id="rule-of-40" number="07" title="Rule of 40 Rankings"
          description="Revenue Growth % + FCF Margin %. Above 40 = efficient growth. The best companies score 60+. This separates real businesses from 'growth at all costs' stories.">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">Top 15 — Elite</h3>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={r40Rankings.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis type="number" stroke="#71717a" />
                  <YAxis type="category" dataKey="ticker" stroke="#71717a" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} content={({ payload }) => {
                    if (!payload?.[0]) return null; const d = payload[0].payload;
                    return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                      <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                      <p className="text-teal-400 mt-1">Ro40: {d.rule_of_40.toFixed(1)} · Growth: {d.revenue_growth?.toFixed(1)}% · FCF: {d.fcf_margin?.toFixed(1) ?? "—"}%</p>
                    </div>);
                  }} />
                  <ReferenceLine x={40} stroke="#fbbf24" strokeDasharray="4 4" label={{ value: "40", fill: "#fbbf24", fontSize: 11 }} />
                  <Bar dataKey="rule_of_40" radius={[0, 6, 6, 0]}>
                    {r40Rankings.slice(0, 15).map((d, i) => (<Cell key={d.ticker} fill={i < 3 ? "#14b8a6" : i < 8 ? "#06b6d4" : "#0ea5e9"} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-1">Bottom 15 — Red Flags</h3>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={r40Rankings.filter(d => d.ticker !== "SOFI").slice(-15).reverse()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis type="number" stroke="#71717a" />
                  <YAxis type="category" dataKey="ticker" stroke="#71717a" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} content={({ payload }) => {
                    if (!payload?.[0]) return null; const d = payload[0].payload;
                    return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                      <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                      <p className="text-rose-400 mt-1">Ro40: {d.rule_of_40.toFixed(1)} · Growth: {d.revenue_growth?.toFixed(1)}%</p>
                    </div>);
                  }} />
                  <ReferenceLine x={40} stroke="#fbbf24" strokeDasharray="4 4" />
                  <Bar dataKey="rule_of_40" radius={[0, 6, 6, 0]}>
                    {r40Rankings.filter(d => d.ticker !== "SOFI").slice(-15).reverse().map((d) => (<Cell key={d.ticker} fill={d.rule_of_40 >= 40 ? "#10b981" : d.rule_of_40 >= 20 ? "#f59e0b" : "#ef4444"} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* ═══ 08: STOCK RETURNS ═══ */}
        <Section id="returns" number="08" title="The Scoreboard: Stock Performance"
          description="Total return from Jan 2020 to today. Captures the full pandemic cycle. The gap between winners and losers is staggering.">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Callout stat={`+${returns[0]?.return_since_2020.toFixed(0)}%`} label={`${returns[0]?.ticker} — #1`} color="emerald" />
            <Callout stat={`${returns[returns.length - 1]?.return_since_2020.toFixed(0)}%`} label={`${returns[returns.length - 1]?.ticker} — worst`} color="rose" />
            <Callout stat={`${returns.filter(d => d.return_since_2020 > 0).length}`} label="Positive since 2020" color="cyan" />
            <Callout stat={`${Math.round(returns.reduce((s, d) => s + d.return_since_2020, 0) / returns.length)}%`} label="Average return" color="blue" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Best 15</h3>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={returns.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="ticker" stroke="#71717a" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} content={({ payload }) => {
                    if (!payload?.[0]) return null; const d = payload[0].payload;
                    return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                      <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                      <p className="text-cyan-400 mt-1">+{d.return_since_2020.toFixed(0)}%</p>
                    </div>);
                  }} />
                  <Bar dataKey="return_since_2020" radius={[0, 6, 6, 0]} fill="#22d3ee" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Worst 15</h3>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={returns.slice(-15).reverse()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" /><XAxis type="number" stroke="#71717a" tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="ticker" stroke="#71717a" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} content={({ payload }) => {
                    if (!payload?.[0]) return null; const d = payload[0].payload;
                    return (<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm">
                      <p className="text-white font-semibold">{d.ticker} — {d.company}</p>
                      <p className="text-rose-400 mt-1">{d.return_since_2020.toFixed(0)}%</p>
                    </div>);
                  }} />
                  <Bar dataKey="return_since_2020" radius={[0, 6, 6, 0]}>
                    {returns.slice(-15).reverse().map((d) => (<Cell key={d.ticker} fill={d.return_since_2020 >= 0 ? "#22d3ee" : "#f43f5e"} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* ═══ 11: HEATMAP ═══ */}
        <Section id="heatmap" number="09" title="Valuation Heatmap"
          description="Every company × every year. Cells colored by EV/Revenue multiple. Blue = cheap, yellow = moderate, red = expensive. The compression from 2021 to present is visible at a glance.">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 overflow-x-auto">
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 text-xs">
              <span className="text-zinc-400">EV/Revenue:</span>
              {[{ c: "#3b82f6", l: "<4x" }, { c: "#22d3ee", l: "4-7x" }, { c: "#84cc16", l: "7-10x" }, { c: "#eab308", l: "10-15x" }, { c: "#f97316", l: "15-25x" }, { c: "#dc2626", l: "25-40x" }, { c: "#991b1b", l: "40x+" }].map((i) => (
                <div key={i.l} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: i.c }} /><span className="text-zinc-400">{i.l}</span>
                </div>
              ))}
            </div>
            <table className="text-xs w-full">
              <thead><tr>
                <th className="text-left py-2 px-2 text-zinc-400 sticky left-0 bg-zinc-900 cursor-pointer hover:text-white transition-colors"
                  onClick={() => setHeatmapSort(prev => prev.field === "ticker" ? { field: "ticker", dir: prev.dir === "asc" ? "desc" : "asc" } : { field: "ticker", dir: "asc" })}>
                  Ticker {heatmapSort.field === "ticker" && <span>{heatmapSort.dir === "asc" ? "↑" : "↓"}</span>}
                </th>
                {heatmapYears.map((y) => (<th key={y} className="text-center py-2 px-2 text-zinc-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => setHeatmapSort(prev => prev.field === y ? { field: y, dir: prev.dir === "desc" ? "asc" : "desc" } : { field: y, dir: "desc" })}>
                  {y} {heatmapSort.field === y && <span>{heatmapSort.dir === "desc" ? "↓" : "↑"}</span>}
                </th>))}
              </tr></thead>
              <tbody>
                {sortedHeatmapData.map((row) => (
                  <tr key={row.ticker} className="hover:bg-zinc-800/20">
                    <td className="py-1 px-2 text-white font-medium sticky left-0 bg-zinc-900/90">{row.ticker}</td>
                    {heatmapYears.map((y) => {
                      const v = row.years[y];
                      return (
                        <td key={y} className="py-1 px-1 text-center">
                          {v !== null ? (
                            <span className="inline-block w-full py-0.5 rounded text-[10px] font-medium"
                              style={{ backgroundColor: heatmapColor(v), color: v > 15 ? "#fff" : "#000" }}>
                              {v.toFixed(0)}x
                            </span>
                          ) : <span className="text-zinc-700">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ═══ 12: COMPANY COMPARISON ═══ */}
        <Section id="compare" number="10" title="Company Comparison"
          description="Select up to 3 companies to compare side-by-side. See how their valuations tracked over time and how their fundamentals stack up.">
          <div className="flex flex-wrap gap-4 mb-6">
            {[{ val: comp1, set: setComp1, color: COMPARE_COLORS[0] },
              { val: comp2, set: setComp2, color: COMPARE_COLORS[1] },
              { val: comp3, set: setComp3, color: COMPARE_COLORS[2] }].map(({ val, set, color }, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <select value={val} onChange={(e) => set(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5">
                  {tickers.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
            ))}
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">EV/Revenue Over Time</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={compTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="year" stroke="#71717a" /><YAxis stroke="#71717a" tickFormatter={(v) => `${v}x`} />
                <Tooltip contentStyle={tooltipStyle} // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => `${Number(v).toFixed(1)}x`} />
                <Legend />
                {compTickers.map((t, i) => (
                  <Line key={t} type="monotone" dataKey={t} stroke={COMPARE_COLORS[i]} strokeWidth={2.5}
                    dot={{ r: 4, fill: COMPARE_COLORS[i] }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Comparison table */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-zinc-400 border-b border-zinc-800">
                <th className="text-left py-3 px-3">Metric</th>
                {compTickers.map((t, i) => (<th key={t} className="text-right py-3 px-3" style={{ color: COMPARE_COLORS[i] }}>{t}</th>))}
              </tr></thead>
              <tbody>{[
                { label: "Revenue", key: "revenue", fmt: formatBillions },
                { label: "Rev Growth", key: "revenue_growth", fmt: formatPct },
                { label: "Gross Margin", key: "gross_margin", fmt: formatPct },
                { label: "Op Margin", key: "operating_margin", fmt: formatPct },
                { label: "FCF Margin", key: "fcf_margin", fmt: formatPct },
                { label: "EV/Revenue", key: "ev_revenue", fmt: formatMultiple },
                { label: "Rule of 40", key: "rule_of_40", fmt: (v: number | null) => v?.toFixed(1) ?? "—" },
                { label: "Return Since 2020", key: "stock_return_since_2020", fmt: (v: number | null) => v !== null ? `${v.toFixed(0)}%` : "—" },
              ].map(({ label, key, fmt }) => (
                <tr key={key} className="border-b border-zinc-800/50">
                  <td className="py-2.5 px-3 text-zinc-400">{label}</td>
                  {compTickers.map((t) => {
                    const d = getCompanyDetails(t, selectedYear);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const v = d ? (d as any)[key] : null;
                    return <td key={t} className="text-right py-2.5 px-3 text-white">{fmt(v)}</td>;
                  })}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Section>

        {/* ═══ 13: FULL TABLE ═══ */}
        <Section id="table" number="11" title="Full Company Dataset"
          description={`Every company for FY${selectedYear}. Search and sort the raw data.`}>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 overflow-x-auto">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <input type="text" placeholder="Search ticker or company..." value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2 w-64 placeholder-zinc-500" />
              <span className="text-sm text-zinc-500">{tableData.length} companies</span>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-zinc-400 border-b border-zinc-800">
                <th className="text-left py-3 px-2">Ticker</th><th className="text-left py-3 px-2">Company</th>
                <th className="text-left py-3 px-2">Sector</th>
                <SortHeader field="revenue" label="Revenue" /><SortHeader field="revenue_growth" label="Growth" />
                <SortHeader field="gross_margin" label="GM%" /><SortHeader field="operating_margin" label="OpM%" />
                <SortHeader field="fcf_margin" label="FCF%" /><SortHeader field="ev_revenue" label="EV/Rev" />
                <SortHeader field="pe" label="P/E" /><SortHeader field="rule_of_40" label="Ro40" />
                <SortHeader field="stock_return_since_2020" label="Ret '20" />
              </tr></thead>
              <tbody>{tableData.map((d) => (
                <tr key={d.ticker} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                  <td className="py-2.5 px-2 text-white font-medium">{d.ticker}</td>
                  <td className="py-2.5 px-2 text-zinc-300 max-w-[150px] truncate">{d.company}</td>
                  <td className="py-2.5 px-2"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${SECTOR_COLORS[d.sector]}15`, color: SECTOR_COLORS[d.sector] }}>{d.sector}</span></td>
                  <td className="text-right py-2.5 px-2 text-zinc-300">{formatBillions(d.revenue)}</td>
                  <td className={`text-right py-2.5 px-2 font-medium ${(d.revenue_growth ?? 0) >= 20 ? "text-emerald-400" : (d.revenue_growth ?? 0) >= 0 ? "text-zinc-300" : "text-red-400"}`}>{formatPct(d.revenue_growth)}</td>
                  <td className="text-right py-2.5 px-2 text-zinc-300">{formatPct(d.gross_margin)}</td>
                  <td className={`text-right py-2.5 px-2 ${(d.operating_margin ?? 0) > 0 ? "text-zinc-300" : "text-red-400"}`}>{formatPct(d.operating_margin)}</td>
                  <td className={`text-right py-2.5 px-2 ${(d.fcf_margin ?? 0) > 0 ? "text-zinc-300" : "text-red-400"}`}>{formatPct(d.fcf_margin)}</td>
                  <td className="text-right py-2.5 px-2 text-white font-medium">{formatMultiple(d.ev_revenue)}</td>
                  <td className="text-right py-2.5 px-2 text-zinc-300">{d.pe ? d.pe.toFixed(1) : "—"}</td>
                  <td className={`text-right py-2.5 px-2 font-medium ${(d.rule_of_40 ?? 0) >= 40 ? "text-emerald-400" : "text-amber-400"}`}>{d.rule_of_40?.toFixed(1) ?? "—"}</td>
                  <td className={`text-right py-2.5 px-2 ${(d.stock_return_since_2020 ?? 0) > 0 ? "text-emerald-400" : "text-red-400"}`}>{d.stock_return_since_2020 !== null ? `${d.stock_return_since_2020.toFixed(0)}%` : "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-zinc-800 px-6 py-10 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-zinc-500">
            <p>Data sourced from Yahoo Finance via yfinance. Updated March 2026.</p>
            <p className="text-zinc-600 mt-1">73 companies · 8 sectors · 590 data points</p>
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
