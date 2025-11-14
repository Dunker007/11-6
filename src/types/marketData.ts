export interface YahooFinanceChartResult {
  meta: {
    regularMarketPrice: number;
    previousClose: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    regularMarketVolume: number;
    marketCap: number;
  };
  timestamp: number[];
  indicators: {
    quote: {
      open: number[];
      high: number[];
      low: number[];
      close: number[];
      volume: number[];
    }[];
  };
  events?: {
    dividends?: Record<string, { amount: number }>;
    earnings?: Record<string, { estimate: number; actual: number; period: string }>;
  };
}

export interface YahooFinanceResponse {
  chart: {
    result: YahooFinanceChartResult[];
  };
}

export interface NewsAPIArticle {
  title: string;
  description: string;
  content: string;
  source: {
    name: string;
  };
  url: string;
  publishedAt: string;
  urlToImage: string;
}

export interface NewsAPIResponse {
  articles: NewsAPIArticle[];
}
