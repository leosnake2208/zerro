import type { TAccountId, TTransactionId, TISODate, TMsTime } from '6-shared/types'

export type TImportId = string

/**
 * Record of a single import operation
 */
export type TImportRecord = {
  /** Unique import ID (UUID) */
  id: TImportId
  /** Account ID the transactions were imported to */
  accountId: TAccountId
  /** Bank SWIFT code */
  bankCode: string
  /** Original file name */
  fileName: string
  /** When the import was performed */
  importDate: TMsTime
  /** Start of statement period */
  dateRangeStart: TISODate
  /** End of statement period */
  dateRangeEnd: TISODate
  /** Number of transactions imported */
  transactionCount: number
  /** IDs of imported transactions (for potential undo) */
  transactionIds: TTransactionId[]
}
