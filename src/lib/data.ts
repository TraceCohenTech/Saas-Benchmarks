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
