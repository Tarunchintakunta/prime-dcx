/** Trading risk disclosure.
 *
 *  Deliberately plain and unhedged. It makes no claim about regulation,
 *  licensing, protection schemes or outcomes, because none has been provided. */
export function RiskDisclosure() {
  return (
    <div className="risk">
      <p className="eyebrow" style={{ color: 'var(--amber)' }}>
        Trading risk disclosure
      </p>
      <h2>Trading involves risk</h2>

      <p>
        <strong>
          Trading involves risk. Losses can exceed deposits depending on the product and
          leverage used. Prime DCX provides tools and access; users make their own decisions.
        </strong>
      </p>

      <ul>
        <li>
          Prices move against positions as well as for them. Past performance of any instrument
          does not indicate future results.
        </li>
        <li>
          Leveraged products magnify both gains and losses. A small move in the underlying market
          can result in a loss substantially larger than the amount you initially committed.
        </li>
        <li>
          Margin positions can be closed automatically if your account falls below the required
          margin level, and this may happen without prior notice.
        </li>
        <li>
          Volatility, gaps and low-liquidity conditions can cause orders to execute at prices
          different from those requested, including stop orders.
        </li>
        <li>
          Digital asset markets trade continuously and can move sharply outside conventional
          market hours.
        </li>
        <li>
          Prime DCX does not provide investment, tax or legal advice, and nothing on this site is
          a recommendation to trade any instrument.
        </li>
        <li>
          Only trade with money you can afford to lose, and seek independent advice if you are
          unsure whether a product is appropriate for you.
        </li>
      </ul>

      <p className="note" style={{ maxWidth: '82ch' }}>
        Product availability, account terms, order types, instrument coverage and funding methods
        depend on your region, account type and verification status, and are confirmed in your
        account agreement. Where this site shows a market interface, the data in it is simulated
        for demonstration and is not a live quote.
      </p>
    </div>
  )
}
