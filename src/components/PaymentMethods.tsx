import { PAYMENT_METHODS, type IconKey, type PaymentMethod } from '../data/paymentMethods'

/** Funding table.
 *
 *  Values come straight from data/paymentMethods.ts, where every commercial
 *  field is an explicit placeholder. Nothing here asserts availability, timing
 *  or cost that Prime DCX has not published. */
export function PaymentMethods() {
  return (
    <div>
      <div className="pay">
        <div className="pay__scroll">
          <table className="pay__table">
            <thead>
              <tr>
                <th scope="col">Method</th>
                <th scope="col">Direction</th>
                <th scope="col">Processing</th>
                <th scope="col">Fees</th>
                <th scope="col">Currency</th>
                <th scope="col">Verification</th>
                <th scope="col">Regions</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {PAYMENT_METHODS.map((m) => (
                <tr key={m.id}>
                  <th scope="row" style={{ fontWeight: 400, background: 'transparent', borderBottom: '1px solid var(--line)' }}>
                    <span className="pay__name">
                      <span className="pay__icon" aria-hidden="true">
                        <MethodIcon icon={m.icon} />
                      </span>
                      {m.name}
                    </span>
                  </th>
                  <td>
                    <span className="pay__flags">
                      <span className="pay__flag" data-on={m.deposit}>
                        Deposit
                      </span>
                      <span className="pay__flag" data-on={m.withdrawal}>
                        Withdrawal
                      </span>
                    </span>
                  </td>
                  <td className="mono">{m.processingTime}</td>
                  <td className="mono">{m.fees}</td>
                  <td className="mono">{m.currency}</td>
                  <td>
                    <Status value={m.verification} />
                  </td>
                  <td>
                    <Status value={m.regions as PaymentMethod['verification']} />
                  </td>
                  <td style={{ minWidth: 240 }}>{m.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Below 860px the table becomes cards so nothing is squeezed. */}
        <div className="pay__cards">
          {PAYMENT_METHODS.map((m) => (
            <div className="pay__card" key={m.id}>
              <span className="pay__name">
                <span className="pay__icon" aria-hidden="true">
                  <MethodIcon icon={m.icon} />
                </span>
                {m.name}
              </span>
              <span className="pay__flags">
                <span className="pay__flag" data-on={m.deposit}>
                  Deposit
                </span>
                <span className="pay__flag" data-on={m.withdrawal}>
                  Withdrawal
                </span>
              </span>
              <dl>
                <dt>Processing</dt>
                <dd className="mono">{m.processingTime}</dd>
                <dt>Fees</dt>
                <dd className="mono">{m.fees}</dd>
                <dt>Currency</dt>
                <dd className="mono">{m.currency}</dd>
                <dt>Verify</dt>
                <dd>
                  <Status value={m.verification} />
                </dd>
                <dt>Regions</dt>
                <dd>
                  <Status value={m.regions as PaymentMethod['verification']} />
                </dd>
                <dt>Notes</dt>
                <dd>{m.notes}</dd>
              </dl>
            </div>
          ))}
        </div>
      </div>

      <p className="note" style={{ marginTop: 16, maxWidth: '80ch' }}>
        Processing times, fees, supported currencies and regional availability are shown as
        placeholders and are confirmed in your account before you transact. Method availability
        depends on your region, account type and verification status. Prime DCX does not
        guarantee that any individual method is available to you.
      </p>
    </div>
  )
}

function Status({ value }: { value: string }) {
  const cls =
    value === 'Available'
      ? 'tag tag--ok'
      : value === 'Verification required'
        ? 'tag tag--warn'
        : value === 'Region dependent'
          ? 'tag tag--info'
          : 'tag tag--mute'
  return <span className={cls}>{value}</span>
}

/** Generic geometric glyphs — deliberately not the real marks of any payment
 *  brand, since we must not imply a partnership that has not been announced. */
function MethodIcon({ icon }: { icon: IconKey }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (icon) {
    case 'bank':
      return (
        <svg {...common}>
          <path d="M2 6.2 8 2.6l6 3.6" />
          <path d="M3.4 6.6v6M6.4 6.6v6M9.6 6.6v6M12.6 6.6v6" />
          <path d="M2 13.4h12" />
        </svg>
      )
    case 'card':
      return (
        <svg {...common}>
          <rect x="1.8" y="3.6" width="12.4" height="8.8" rx="1.2" />
          <path d="M1.8 6.6h12.4" />
          <path d="M4 10.2h2.6" />
        </svg>
      )
    case 'upi':
      return (
        <svg {...common}>
          <path d="M4 2.6 9.4 8 4 13.4" />
          <path d="M8 2.6 13.4 8 8 13.4" />
        </svg>
      )
    case 'netbanking':
      return (
        <svg {...common}>
          <rect x="1.8" y="2.6" width="12.4" height="10.8" rx="1.2" />
          <path d="M1.8 5.6h12.4M5 8.4h6M5 10.8h4" />
        </svg>
      )
    case 'crypto':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5.6" />
          <path d="M6.2 5.4h3a1.6 1.6 0 0 1 0 3.2h-3M6.2 8.6h3.2a1.6 1.6 0 0 1 0 3.2H6.2M6.2 5.4v6.4M7.6 4v1.4M7.6 11.8v1.4" />
        </svg>
      )
    case 'usdt':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5.6" />
          <path d="M4.8 5.8h6.4M8 5.8v5.4" />
          <path d="M5.4 7.4c0 .7 1.2 1.2 2.6 1.2s2.6-.5 2.6-1.2" />
        </svg>
      )
    case 'skrill':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5.6" />
          <path d="M10 5.8c-.7-.6-3.6-.9-3.6.9 0 1.6 3.4 1 3.4 2.6 0 1.8-2.9 1.5-3.6.9" />
        </svg>
      )
    case 'neteller':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5.6" />
          <path d="M6 10.4V5.6l4 4.8V5.6" />
        </svg>
      )
    case 'local':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5.6" />
          <path d="M2.4 8h11.2" />
          <path d="M8 2.4c1.6 1.8 2.4 3.7 2.4 5.6S9.6 11.8 8 13.6C6.4 11.8 5.6 9.9 5.6 8s.8-3.8 2.4-5.6Z" />
        </svg>
      )
    case 'manual':
    default:
      return (
        <svg {...common}>
          <path d="M2.6 4.2h10.8v7.6H2.6z" />
          <path d="M2.6 4.2 8 8.6l5.4-4.4" />
        </svg>
      )
  }
}
