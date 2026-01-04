import { v1 as uuidv1 } from 'uuid'
import type { AppThunk } from 'store'
import { applyClientPatch } from 'store/data'
import { trModel } from '5-entities/transaction'
import { accountModel } from '5-entities/account'
import { importModel, TImportRecord } from '5-entities/import'
import { parseStatement, TParseResult, TParsedTransaction } from './converters'
import { sendEvent } from '6-shared/helpers/tracking'
import type { TTransaction, TAccountId, TISODate } from '6-shared/types'

export type TImportOptions = {
  /** Target account ID */
  accountId: TAccountId
  /** Skip transactions that look like duplicates */
  skipDuplicates: boolean
}

export type TImportResult = {
  /** Number of successfully imported transactions */
  imported: number
  /** Number of skipped duplicates */
  skipped: number
  /** Import record for history */
  importRecord: TImportRecord
}

/**
 * Check if parsed transaction is likely a duplicate
 */
function isDuplicate(
  parsed: TParsedTransaction,
  existing: Record<string, TTransaction>,
  accountId: TAccountId
): boolean {
  for (const id in existing) {
    const tr = existing[id]
    if (tr.deleted) continue
    if (tr.date !== parsed.date) continue

    // Check if transaction involves the same account
    const involvesAccount =
      tr.incomeAccount === accountId || tr.outcomeAccount === accountId
    if (!involvesAccount) continue

    // Compare amounts
    const parsedAmount = Math.abs(parsed.amount)
    const trAmount = parsed.amount > 0 ? tr.income : tr.outcome
    if (Math.abs(trAmount - parsedAmount) > 0.01) continue

    // Similar payee or same fitId in comment
    if (
      tr.payee === parsed.payee ||
      tr.originalPayee === parsed.payee ||
      tr.comment?.includes(parsed.fitId)
    ) {
      return true
    }
  }
  return false
}

/**
 * Import bank statement file
 * @param fileContent Raw file content as string
 * @param fileName Original file name
 * @param options Import options
 * @returns Import result with statistics
 */
export const importStatement =
  (
    fileContent: string,
    fileName: string,
    options: TImportOptions
  ): AppThunk<TImportResult> =>
  (dispatch, getState) => {
    const state = getState()
    const accounts = accountModel.getAccounts(state)
    const targetAccount = accounts[options.accountId]

    if (!targetAccount) {
      throw new Error('Account not found')
    }

    // Parse file
    const parseResult = parseStatement(fileContent, fileName)
    if (!parseResult) {
      throw new Error('Unsupported file format')
    }

    // Get existing transactions for duplicate check
    const existingTransactions = trModel.getTransactionsById(state)

    // Convert parsed transactions to Zerro transactions
    const transactions: TTransaction[] = []
    let skippedCount = 0

    for (const parsed of parseResult.transactions) {
      // Skip duplicates if enabled
      if (
        options.skipDuplicates &&
        isDuplicate(parsed, existingTransactions, options.accountId)
      ) {
        skippedCount++
        continue
      }

      // Create transaction
      // For income (positive amount): money comes INTO the account
      // For expense (negative amount): money goes OUT of the account
      const isIncome = parsed.amount > 0
      const amount = Math.abs(parsed.amount)

      const tr = trModel.makeTransaction({
        user: targetAccount.user,
        date: parsed.date,

        // For income: account receives money
        // For expense: account sends money
        incomeInstrument: targetAccount.instrument,
        outcomeInstrument: targetAccount.instrument,
        incomeAccount: options.accountId,
        outcomeAccount: options.accountId,
        income: isIncome ? amount : 0,
        outcome: isIncome ? 0 : amount,

        // Metadata
        payee: parsed.payee || null,
        originalPayee: parsed.payee || null,
        comment: `[Import: ${parsed.fitId}] ${parsed.memo}`.substring(0, 255),
      })

      transactions.push(tr)
    }

    // Apply transactions to state
    if (transactions.length > 0) {
      dispatch(applyClientPatch({ transaction: transactions }))
    }

    // Create import record for history
    const importRecord: TImportRecord = {
      id: uuidv1(),
      accountId: options.accountId,
      bankCode: parseResult.bankCode,
      fileName,
      importDate: Date.now(),
      dateRangeStart: parseResult.dateStart,
      dateRangeEnd: parseResult.dateEnd,
      transactionCount: transactions.length,
      transactionIds: transactions.map(t => t.id),
    }

    // Save to import history
    importModel.addImportRecord(importRecord)

    // Track event
    sendEvent(`Import: Statement imported (${parseResult.bankCode}, ${transactions.length} txns)`)

    return {
      imported: transactions.length,
      skipped: skippedCount,
      importRecord,
    }
  }

/**
 * Preview import without actually importing
 * @returns Parse result for preview
 */
export function previewImport(
  fileContent: string,
  fileName: string
): TParseResult | null {
  return parseStatement(fileContent, fileName)
}
