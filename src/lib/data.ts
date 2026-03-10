import rawData from "@/data/companies.json";

export interface CompanyYear {
  company: string;
  ticker: string;
  sector: string;
  year: number;
  ipo_year: number;
  revenue: number | null;
  revenue_growth: number | null;
  revenue_growth_3yr_cagr: number | null;
  revenue_growth_5yr_cagr: number | null;
  gross_profit: number | null;
  gross_margin: number | null;
  operating_income: number | null;
  operating_margin: number | null;
  net_income: number | null;
  net_margin: number | null;
  ebitda: number | null;
  free_cash_flow: number | null;
  fcf_margin: number | null;
  stock_price_end_year: number | null;
  market_cap: number | null;
  enterprise_value: number | null;
  ev_revenue: number | null;
  ev_ebitda: number | null;
  pe: number | null;
  price_sales: number | null;
  rule_of_40: number | null;
  stock_return_since_2020: number | null;
  stock_return_ytd: number | null;
}

export const data: CompanyYear[] = rawData as CompanyYear[];

export const sectors = Array.from(new Set(data.map((d) => d.sector))).sort();
export const tickers = Array.from(new Set(data.map((d) => d.ticker))).sort();
export const years = Array.from(new Set(data.map((d) => d.year))).sort();

export function getLatestYear(): number {
  // Find the year with the most EV/Revenue data
  const yearCounts = years.map((y) => ({
    year: y,
    count: data.filter((d) => d.year === y && d.ev_revenue !== null).length,
  }));
  yearCounts.sort((a, b) => b.count - a.count);
  return yearCounts[0]?.year ?? 2025;
}

export function getCompanyLatest(ticker: string): CompanyYear | undefined {
  return data
    .filter((d) => d.ticker === ticker && d.revenue !== null)
    .sort((a, b) => b.year - a.year)[0];
}

export function getSectorMedian(
  sector: string,
  year: number,
  field: keyof CompanyYear
): number | null {
  const vals = data
    .filter((d) => d.sector === sector && d.year === year && d[field] !== null)
    .map((d) => d[field] as number)
    .sort((a, b) => a - b);
  if (vals.length === 0) return null;
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 !== 0 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
}

export function getOverallMedian(
  year: number,
  field: keyof CompanyYear
): number | null {
  const vals = data
    .filter((d) => d.year === year && d[field] !== null)
    .map((d) => d[field] as number)
    .sort((a, b) => a - b);
  if (vals.length === 0) return null;
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 !== 0 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
}

export function formatBillions(val: number | null): string {
  if (val === null) return "—";
  if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toFixed(0)}`;
}

export function formatPct(val: number | null): string {
  if (val === null) return "—";
  return `${val.toFixed(1)}%`;
}

export function formatMultiple(val: number | null): string {
  if (val === null) return "—";
  return `${val.toFixed(1)}x`;
}

// Median EV/Revenue by year across all companies
export function getMedianEvRevenueByYear(): { year: number; median: number }[] {
  return years
    .map((y) => ({
      year: y,
      median: getOverallMedian(y, "ev_revenue"),
    }))
    .filter((d) => d.median !== null) as { year: number; median: number }[];
}

// Median EV/Revenue by sector and year
export function getSectorEvRevenueTimeSeries(): {
  year: number;
  [sector: string]: number | null;
}[] {
  const yearsWithData = years.filter(
    (y) => data.some((d) => d.year === y && d.ev_revenue !== null)
  );
  return yearsWithData.map((y) => {
    const row: Record<string, number | null> = { year: y };
    sectors.forEach((s) => {
      row[s] = getSectorMedian(s, y, "ev_revenue");
    });
    return row as { year: number; [sector: string]: number | null };
  });
}

// Scatter data: growth vs EV/Revenue
export function getGrowthVsValuation(year: number) {
  return data
    .filter(
      (d) =>
        d.year === year &&
        d.revenue_growth !== null &&
        d.ev_revenue !== null
    )
    .map((d) => ({
      ticker: d.ticker,
      company: d.company,
      sector: d.sector,
      revenue_growth: d.revenue_growth!,
      ev_revenue: d.ev_revenue!,
      market_cap: d.market_cap,
    }));
}

// Rule of 40 by company
export function getRuleOf40Rankings(year: number) {
  return data
    .filter((d) => d.year === year && d.rule_of_40 !== null)
    .sort((a, b) => (b.rule_of_40 ?? 0) - (a.rule_of_40 ?? 0))
    .map((d) => ({
      ticker: d.ticker,
      company: d.company,
      sector: d.sector,
      rule_of_40: d.rule_of_40!,
      revenue_growth: d.revenue_growth,
      fcf_margin: d.fcf_margin,
      operating_margin: d.operating_margin,
    }));
}

// Multiple compression: peak EV/Rev (2021) vs latest
export function getMultipleCompression() {
  return tickers
    .map((t) => {
      const peak =
        data.find((d) => d.ticker === t && d.year === 2021 && d.ev_revenue !== null) ??
        data.find((d) => d.ticker === t && d.year === 2022 && d.ev_revenue !== null);
      const latest = data
        .filter((d) => d.ticker === t && d.ev_revenue !== null)
        .sort((a, b) => b.year - a.year)[0];
      if (!peak || !latest) return null;
      return {
        ticker: t,
        company: peak.company,
        sector: peak.sector,
        peak_ev_revenue: peak.ev_revenue!,
        peak_year: peak.year,
        latest_ev_revenue: latest.ev_revenue!,
        latest_year: latest.year,
        compression: latest.ev_revenue! - peak.ev_revenue!,
        compression_pct:
          peak.ev_revenue! > 0
            ? ((latest.ev_revenue! / peak.ev_revenue!) - 1) * 100
            : null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a!.compression ?? 0) - (b!.compression ?? 0)) as {
    ticker: string;
    company: string;
    sector: string;
    peak_ev_revenue: number;
    peak_year: number;
    latest_ev_revenue: number;
    latest_year: number;
    compression: number;
    compression_pct: number | null;
  }[];
}

// Margin expansion: operating margin change from 2022 to latest
export function getMarginExpansion() {
  return tickers
    .map((t) => {
      const d2022 = data.find(
        (d) => d.ticker === t && d.year === 2022 && d.operating_margin !== null
      );
      const latest = data
        .filter((d) => d.ticker === t && d.operating_margin !== null)
        .sort((a, b) => b.year - a.year)[0];
      if (!d2022 || !latest || latest.year <= 2022) return null;
      return {
        ticker: t,
        company: d2022.company,
        sector: d2022.sector,
        om_2022: d2022.operating_margin!,
        om_latest: latest.operating_margin!,
        latest_year: latest.year,
        expansion: latest.operating_margin! - d2022.operating_margin!,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.expansion - a!.expansion) as {
    ticker: string;
    company: string;
    sector: string;
    om_2022: number;
    om_latest: number;
    latest_year: number;
    expansion: number;
  }[];
}

// "Never Deserved It" — peak EV/Rev vs stock return since 2020
export function getNeverDeservedIt() {
  const latestYear = getLatestYear();
  return tickers
    .map((t) => {
      const peak =
        data.find(
          (d) => d.ticker === t && d.year === 2021 && d.ev_revenue !== null
        ) ??
        data.find(
          (d) => d.ticker === t && d.year === 2022 && d.ev_revenue !== null
        );
      const latest = data.find(
        (d) =>
          d.ticker === t &&
          d.year === latestYear &&
          d.stock_return_since_2020 !== null
      );
      if (!peak || !latest) return null;
      return {
        ticker: t,
        company: peak.company,
        sector: peak.sector,
        peak_ev_revenue: peak.ev_revenue!,
        stock_return: latest.stock_return_since_2020!,
      };
    })
    .filter(Boolean) as {
    ticker: string;
    company: string;
    sector: string;
    peak_ev_revenue: number;
    stock_return: number;
  }[];
}

// Sound bite stats auto-calculated from data
export function getSoundBites() {
  const latestYear = getLatestYear();

  // Peak vs current median EV/Rev
  const peakMedian = getOverallMedian(2021, "ev_revenue") ?? getOverallMedian(2022, "ev_revenue");
  const currentMedian = getOverallMedian(latestYear, "ev_revenue");
  const compressionPct =
    peakMedian && currentMedian
      ? Math.round(((currentMedian / peakMedian) - 1) * 100)
      : null;

  // Best performer
  const latestData = data.filter(
    (d) => d.year === latestYear && d.stock_return_since_2020 !== null
  );
  const bestStock = latestData.sort(
    (a, b) =>
      (b.stock_return_since_2020 ?? 0) - (a.stock_return_since_2020 ?? 0)
  )[0];
  const worstStock = latestData.sort(
    (a, b) =>
      (a.stock_return_since_2020 ?? 0) - (b.stock_return_since_2020 ?? 0)
  )[0];

  // Highest Rule of 40
  const r40Data = data.filter(
    (d) => d.year === latestYear && d.rule_of_40 !== null
  );
  const bestR40 = r40Data.sort(
    (a, b) => (b.rule_of_40 ?? 0) - (a.rule_of_40 ?? 0)
  )[0];

  // Biggest single compression
  const compressions = getMultipleCompression();
  const biggestDrop = compressions[0];

  // Margin expansion leader
  const expansions = getMarginExpansion();
  const marginLeader = expansions[0];

  // Companies above rule of 40
  const above40 = r40Data.filter((d) => (d.rule_of_40 ?? 0) >= 40).length;
  const totalR40 = r40Data.length;

  return {
    peakMedian,
    currentMedian,
    compressionPct,
    bestStock,
    worstStock,
    bestR40,
    biggestDrop,
    marginLeader,
    above40,
    totalR40,
  };
}

// Helper: compute median of a numeric array
function median(arr: number[]): number | null {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// AI Beneficiaries list
export const AI_TICKERS = [
  "NVDA", "AMD", "AVGO", "ARM", "SMCI", "CRWD", "DDOG", "SNOW", "NET",
  "MDB", "PANW", "ZS", "NOW", "MSFT", "GOOGL", "META", "CFLT",
];

// Heatmap: Company x Year grid for EV/Revenue
export function getHeatmapData(): {
  ticker: string;
  company: string;
  sector: string;
  years: Record<number, number | null>;
}[] {
  const companiesWithEvRev = Array.from(
    new Set(data.filter((d) => d.ev_revenue !== null).map((d) => d.ticker))
  ).sort();
  return companiesWithEvRev.map((t) => {
    const rows = data.filter((d) => d.ticker === t);
    const yearMap: Record<number, number | null> = {};
    years.forEach((y) => {
      const row = rows.find((d) => d.year === y);
      yearMap[y] = row?.ev_revenue ?? null;
    });
    const firstRow = rows[0];
    return {
      ticker: t,
      company: firstRow?.company ?? t,
      sector: firstRow?.sector ?? "",
      years: yearMap,
    };
  });
}

// AI Premium comparison
export function getAIPremiumData(year: number) {
  const yearData = data.filter((d) => d.year === year);
  const aiData = yearData.filter((d) => AI_TICKERS.includes(d.ticker));
  const nonAiData = yearData.filter((d) => !AI_TICKERS.includes(d.ticker));

  const aiEvRevVals = aiData.filter((d) => d.ev_revenue !== null).map((d) => d.ev_revenue!);
  const nonAiEvRevVals = nonAiData.filter((d) => d.ev_revenue !== null).map((d) => d.ev_revenue!);
  const aiReturnVals = aiData.filter((d) => d.stock_return_since_2020 !== null).map((d) => d.stock_return_since_2020!);
  const nonAiReturnVals = nonAiData.filter((d) => d.stock_return_since_2020 !== null).map((d) => d.stock_return_since_2020!);

  return {
    aiMedianEvRev: median(aiEvRevVals),
    nonAiMedianEvRev: median(nonAiEvRevVals),
    aiMedianReturn: median(aiReturnVals),
    nonAiMedianReturn: median(nonAiReturnVals),
    aiCount: aiData.filter((d) => d.revenue !== null).length,
    nonAiCount: nonAiData.filter((d) => d.revenue !== null).length,
  };
}

// AI vs Non-AI time series for comparison
export function getAIvsNonAITimeSeries() {
  return years
    .map((y) => {
      const yearData = data.filter((d) => d.year === y && d.ev_revenue !== null);
      const aiVals = yearData.filter((d) => AI_TICKERS.includes(d.ticker)).map((d) => d.ev_revenue!);
      const nonAiVals = yearData.filter((d) => !AI_TICKERS.includes(d.ticker)).map((d) => d.ev_revenue!);
      const aiMed = median(aiVals);
      const nonAiMed = median(nonAiVals);
      if (aiMed === null && nonAiMed === null) return null;
      return { year: y, ai: aiMed, nonAi: nonAiMed };
    })
    .filter(Boolean) as { year: number; ai: number | null; nonAi: number | null }[];
}

// $1B Revenue Club
export function getBillionRevenueClub() {
  const tickerList = Array.from(new Set(data.map((d) => d.ticker)));
  return tickerList
    .map((t) => {
      const rows = data.filter((d) => d.ticker === t && d.revenue !== null).sort((a, b) => a.year - b.year);
      const crossedRow = rows.find((d) => (d.revenue ?? 0) >= 1e9);
      if (!crossedRow) return null;
      const ipoYear = crossedRow.ipo_year;
      const yearsCrossed = crossedRow.year;
      const yearsToB = yearsCrossed - ipoYear;
      return {
        ticker: t,
        company: crossedRow.company,
        sector: crossedRow.sector,
        ipo_year: ipoYear,
        crossed_year: yearsCrossed,
        years_to_billion: yearsToB,
        revenue_at_crossing: crossedRow.revenue!,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.years_to_billion - b!.years_to_billion) as {
    ticker: string;
    company: string;
    sector: string;
    ipo_year: number;
    crossed_year: number;
    years_to_billion: number;
    revenue_at_crossing: number;
  }[];
}

// Key Takeaways auto-generated
export function getKeyTakeaways(): string[] {
  const latestYear = getLatestYear();
  const takeaways: string[] = [];

  // 1. Median compression
  const peakMed = getOverallMedian(2021, "ev_revenue");
  const currMed = getOverallMedian(latestYear, "ev_revenue");
  if (peakMed && currMed) {
    const pct = Math.abs(Math.round(((currMed / peakMed) - 1) * 100));
    takeaways.push(`The median SaaS multiple compressed ${pct}% from ${peakMed.toFixed(1)}x in 2021 to ${currMed.toFixed(1)}x today.`);
  }

  // 2. Best performer
  const latestData = data.filter((d) => d.year === latestYear && d.stock_return_since_2020 !== null);
  const best = [...latestData].sort((a, b) => (b.stock_return_since_2020 ?? 0) - (a.stock_return_since_2020 ?? 0))[0];
  if (best) {
    takeaways.push(`${best.ticker} is up ${best.stock_return_since_2020?.toFixed(0)}% since 2020 — the best performer in the dataset.`);
  }

  // 3. Rule of 40 comparison
  const r40Now = data.filter((d) => d.year === latestYear && d.rule_of_40 !== null);
  const above40Now = r40Now.filter((d) => (d.rule_of_40 ?? 0) >= 40).length;
  const r40Then = data.filter((d) => d.year === 2022 && d.rule_of_40 !== null);
  const above40Then = r40Then.filter((d) => (d.rule_of_40 ?? 0) >= 40).length;
  takeaways.push(`${above40Now} companies now pass the Rule of 40, up from ${above40Then} in 2022.`);

  // 4. Highest sector median
  const sectorMeds = sectors.map((s) => ({
    sector: s,
    med: getSectorMedian(s, latestYear, "ev_revenue"),
  })).filter((s) => s.med !== null).sort((a, b) => (b.med ?? 0) - (a.med ?? 0));
  if (sectorMeds[0]) {
    takeaways.push(`${sectorMeds[0].sector} commands the highest median multiple at ${sectorMeds[0].med?.toFixed(1)}x.`);
  }

  // 5. Unprofitable to profitable
  const marginExp = getMarginExpansion();
  const flipped = marginExp.filter((d) => d.om_latest > 0 && d.om_2022 < 0).length;
  takeaways.push(`${flipped} companies went from unprofitable to profitable since 2022.`);

  // 6. AI premium
  const aiPrem = getAIPremiumData(latestYear);
  if (aiPrem.aiMedianEvRev && aiPrem.nonAiMedianEvRev) {
    const premium = ((aiPrem.aiMedianEvRev / aiPrem.nonAiMedianEvRev) - 1) * 100;
    takeaways.push(`AI beneficiaries trade at a ${Math.round(premium)}% premium to non-AI companies (${aiPrem.aiMedianEvRev.toFixed(1)}x vs ${aiPrem.nonAiMedianEvRev.toFixed(1)}x).`);
  }

  // 7. Worst performer
  const worst = [...latestData].sort((a, b) => (a.stock_return_since_2020 ?? 0) - (b.stock_return_since_2020 ?? 0))[0];
  if (worst) {
    takeaways.push(`${worst.ticker} is the worst performer at ${worst.stock_return_since_2020?.toFixed(0)}% since 2020.`);
  }

  return takeaways;
}

// Sector Best in Class
export function getSectorBestInClass(year: number) {
  return sectors.map((s) => {
    const sectorData = data.filter((d) => d.sector === s && d.year === year && d.revenue !== null);
    const bestEvRev = [...sectorData].filter((d) => d.ev_revenue !== null).sort((a, b) => (b.ev_revenue ?? 0) - (a.ev_revenue ?? 0))[0];
    const bestGrowth = [...sectorData].filter((d) => d.revenue_growth !== null).sort((a, b) => (b.revenue_growth ?? 0) - (a.revenue_growth ?? 0))[0];
    const bestR40 = [...sectorData].filter((d) => d.rule_of_40 !== null).sort((a, b) => (b.rule_of_40 ?? 0) - (a.rule_of_40 ?? 0))[0];
    const bestMargin = [...sectorData].filter((d) => d.operating_margin !== null).sort((a, b) => (b.operating_margin ?? 0) - (a.operating_margin ?? 0))[0];
    return {
      sector: s,
      bestEvRev: bestEvRev ? { ticker: bestEvRev.ticker, value: bestEvRev.ev_revenue! } : null,
      bestGrowth: bestGrowth ? { ticker: bestGrowth.ticker, value: bestGrowth.revenue_growth! } : null,
      bestR40: bestR40 ? { ticker: bestR40.ticker, value: bestR40.rule_of_40! } : null,
      bestMargin: bestMargin ? { ticker: bestMargin.ticker, value: bestMargin.operating_margin! } : null,
    };
  });
}

// Company comparison data
export function getCompanyTimeSeries(ticker: string) {
  return data
    .filter((d) => d.ticker === ticker && d.ev_revenue !== null)
    .sort((a, b) => a.year - b.year)
    .map((d) => ({
      year: d.year,
      ev_revenue: d.ev_revenue!,
    }));
}

export function getCompanyDetails(ticker: string, year: number) {
  return data.find((d) => d.ticker === ticker && d.year === year) ?? null;
}

// CSV export
export function generateCSV(): string {
  const headers = [
    "company", "ticker", "sector", "year", "ipo_year",
    "revenue", "revenue_growth", "gross_margin", "operating_margin",
    "net_margin", "fcf_margin", "ev_revenue", "ev_ebitda", "pe",
    "rule_of_40", "stock_return_since_2020", "market_cap", "enterprise_value",
  ];
  const rows = data.map((d) =>
    headers.map((h) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = (d as any)[h];
      if (val === null || val === undefined) return "";
      if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
      return String(val);
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

// Stock return since 2020 rankings
export function getStockReturnRankings() {
  const latestYear = getLatestYear();
  return data
    .filter(
      (d) =>
        d.year === latestYear && d.stock_return_since_2020 !== null
    )
    .sort(
      (a, b) =>
        (b.stock_return_since_2020 ?? 0) - (a.stock_return_since_2020 ?? 0)
    )
    .map((d) => ({
      ticker: d.ticker,
      company: d.company,
      sector: d.sector,
      return_since_2020: d.stock_return_since_2020!,
    }));
}
