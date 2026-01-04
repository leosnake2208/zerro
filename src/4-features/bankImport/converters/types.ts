import type { TISODate, TFxCode } from '6-shared/types'

/**
 * Parsed transaction from bank statement
 */
export type TParsedTransaction = {
  /** Unique transaction ID from bank (for duplicate detection) */
  fitId: string
  /** Transaction date in ISO format */
  date: TISODate
  /** Amount: positive for income, negative for expense */
  amount: number
  /** Currency code */
  currency: TFxCode
  /** Payee/merchant name */
  payee: string
  /** Transaction description/memo */
  memo: string
  /** Account number from statement (for matching) */
  accountNumber?: string
}

/**
 * Result of parsing a bank statement file
 */
export type TParseResult = {
  /** Bank SWIFT code (first 6 chars) */
  bankCode: string
  /** Account number from statement */
  accountNumber: string
  /** Currency of the account */
  currency: TFxCode
  /** Start date of statement period */
  dateStart: TISODate
  /** End date of statement period */
  dateEnd: TISODate
  /** List of parsed transactions */
  transactions: TParsedTransaction[]
}

/**
 * Bank statement converter interface
 */
export type TBankConverter = {
  /** SWIFT code prefix (first 6 chars) */
  bankCode: string
  /** Human-readable bank name */
  bankName: string
  /** Supported file formats */
  supportedFormats: string[]
  /** Detect if file belongs to this bank */
  detect: (content: string, fileName: string) => boolean
  /** Parse file content into transactions */
  parse: (content: string) => TParseResult
}
