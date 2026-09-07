/** Funding and withdrawal methods.
 *
 *  Every commercial value below is an editable placeholder. Prime DCX has not
 *  published processing times, fees, currencies or regional availability, so
 *  this file states none of them as fact — it ships the structure and the
 *  labels, and the operations team fills in the real values before launch.
 *  Do not replace a placeholder with a guess. */

export type Availability =
  | 'Available'
  | 'Region dependent'
  | 'Verification required'
  | 'Coming soon'
  | 'To be confirmed'

export type IconKey =
  | 'bank'
  | 'card'
  | 'upi'
  | 'netbanking'
  | 'crypto'
  | 'usdt'
  | 'skrill'
  | 'neteller'
  | 'local'
  | 'manual'

export interface PaymentMethod {
  id: string
  name: string
  icon: IconKey
  deposit: boolean
  withdrawal: boolean
  /** Placeholder — replace with the published processing window. */
  processingTime: string
  /** Placeholder — replace with the published fee schedule. */
  fees: string
  /** Placeholder — replace with the supported currency list. */
  currency: string
  verification: Availability
  regions: string
  notes: string
}

export const PLACEHOLDER = 'To be confirmed'

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'wire',
    name: 'Bank Wire Transfer',
    icon: 'bank',
    deposit: true,
    withdrawal: true,
    processingTime: PLACEHOLDER,
    fees: PLACEHOLDER,
    currency: PLACEHOLDER,
    verification: 'Verification required',
    regions: 'Region dependent',
    notes: 'Sending account must match the verified account holder.',
  },
  {
    id: 'card',
    name: 'Credit / Debit Card',
    icon: 'card',
    deposit: true,
    withdrawal: true,
    processingTime: PLACEHOLDER,
    fees: PLACEHOLDER,
    currency: PLACEHOLDER,
    verification: 'Verification required',
    regions: 'Region dependent',
    notes: 'Withdrawals may be returned to the original card first.',
  },
  {
    id: 'upi',
    name: 'UPI',
    icon: 'upi',
    deposit: true,
    withdrawal: true,
    processingTime: PLACEHOLDER,
    fees: PLACEHOLDER,
    currency: PLACEHOLDER,
    verification: 'Verification required',
    regions: 'Region dependent',
    notes: 'Availability and limits are set by the receiving institution.',
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    icon: 'netbanking',
    deposit: true,
    withdrawal: false,
    processingTime: PLACEHOLDER,
    fees: PLACEHOLDER,
    currency: PLACEHOLDER,
    verification: 'Verification required',
    regions: 'Region dependent',
    notes: 'Withdrawal routing for this method is to be confirmed.',
  },
  {
    id: 'crypto',
    name: 'Crypto Deposit',
    icon: 'crypto',
    deposit: true,
    withdrawal: true,
    processingTime: PLACEHOLDER,
    fees: PLACEHOLDER,
    currency: PLACEHOLDER,
    verification: 'Verification required',
    regions: 'Region dependent',
    notes: 'Network confirmations apply. Send only the listed asset and network.',
  },
  {
    id: 'usdt',
    name: 'USDT',
    icon: 'usdt',
    deposit: true,
    withdrawal: true,
    processingTime: PLACEHOLDER,
    fees: PLACEHOLDER,
    currency: PLACEHOLDER,
    verification: 'Verification required',
    regions: 'Region dependent',
    notes: 'Supported networks to be confirmed before transfer.',
  },
  {
    id: 'skrill',
    name: 'Skrill',
    icon: 'skrill',
    deposit: true,
    withdrawal: true,
    processingTime: PLACEHOLDER,
    fees: PLACEHOLDER,
    currency: PLACEHOLDER,
    verification: 'Verification required',
    regions: 'Region dependent',
    notes: 'Wallet must be registered to the verified account holder.',
  },
  {
    id: 'neteller',
    name: 'Neteller',
    icon: 'neteller',
    deposit: true,
    withdrawal: true,
    processingTime: PLACEHOLDER,
    fees: PLACEHOLDER,
    currency: PLACEHOLDER,
    verification: 'Verification required',
    regions: 'Region dependent',
    notes: 'Wallet must be registered to the verified account holder.',
  },
  {
    id: 'local',
    name: 'Local Payment Methods',
    icon: 'local',
    deposit: true,
    withdrawal: true,
    processingTime: PLACEHOLDER,
    fees: PLACEHOLDER,
    currency: PLACEHOLDER,
    verification: 'Region dependent',
    regions: 'Region dependent',
    notes: 'The available set differs by country and is confirmed at signup.',
  },
  {
    id: 'manual',
    name: 'Manual Broker Transfer',
    icon: 'manual',
    deposit: true,
    withdrawal: true,
    processingTime: PLACEHOLDER,
    fees: PLACEHOLDER,
    currency: PLACEHOLDER,
    verification: 'Verification required',
    regions: 'Region dependent',
    notes: 'Handled by support with manual reconciliation and confirmation.',
  },
]
