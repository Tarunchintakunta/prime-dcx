/** Instrument groups shown in the multi-asset section.
 *
 *  Availability is deliberately unquantified: no spreads, leverage, commission
 *  or instrument counts are stated anywhere, because those are commercial terms
 *  that belong to a real account agreement rather than a marketing page. */
export interface MarketGroup {
  id: string
  name: string
  blurb: string
  examples: string[]
}

export const MARKET_GROUPS: MarketGroup[] = [
  {
    id: 'forex',
    name: 'Forex',
    blurb: 'Major, minor and cross currency pairs across the trading week.',
    examples: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/INR'],
  },
  {
    id: 'crypto',
    name: 'Crypto',
    blurb: 'Large-cap digital assets, quoted continuously.',
    examples: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD'],
  },
  {
    id: 'indices',
    name: 'Indices',
    blurb: 'Benchmark equity index exposure across regions.',
    examples: ['US 500', 'US TECH 100', 'GER 40', 'UK 100', 'JPN 225'],
  },
  {
    id: 'commodities',
    name: 'Commodities',
    blurb: 'Energy and soft commodity contracts.',
    examples: ['WTI', 'BRENT', 'NAT GAS'],
  },
  {
    id: 'metals',
    name: 'Metals',
    blurb: 'Precious and industrial metals against major currencies.',
    examples: ['XAU/USD', 'XAG/USD', 'COPPER'],
  },
  {
    id: 'shares',
    name: 'Shares & CFDs',
    blurb: 'Single-name share CFDs from listed venues.',
    examples: ['US large cap', 'EU large cap', 'APAC large cap'],
  },
]

/** Ticker rows. Prices are simulated for interface demonstration only — the
 *  component that renders them says so on screen. */
export interface TickerInstrument {
  symbol: string
  seed: number
  decimals: number
  group: string
}

export const TICKER_INSTRUMENTS: TickerInstrument[] = [
  { symbol: 'EUR/USD', seed: 1.0842, decimals: 4, group: 'forex' },
  { symbol: 'GBP/USD', seed: 1.2671, decimals: 4, group: 'forex' },
  { symbol: 'USD/JPY', seed: 151.34, decimals: 2, group: 'forex' },
  { symbol: 'XAU/USD', seed: 2318.4, decimals: 1, group: 'metals' },
  { symbol: 'BTC/USD', seed: 64280, decimals: 0, group: 'crypto' },
  { symbol: 'ETH/USD', seed: 3142.6, decimals: 1, group: 'crypto' },
  { symbol: 'US 500', seed: 5218.7, decimals: 1, group: 'indices' },
  { symbol: 'US TECH 100', seed: 18240, decimals: 0, group: 'indices' },
  { symbol: 'GER 40', seed: 18112, decimals: 0, group: 'indices' },
  { symbol: 'WTI', seed: 81.24, decimals: 2, group: 'commodities' },
  { symbol: 'XAG/USD', seed: 27.42, decimals: 2, group: 'metals' },
  { symbol: 'AUD/USD', seed: 0.6612, decimals: 4, group: 'forex' },
]
