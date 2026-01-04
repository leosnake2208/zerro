import type { TAccount, TAccountId } from '6-shared/types'
import type { TParseResult } from './converters'

type AccountsById = Record<TAccountId, TAccount>

/**
 * Match account by SWIFT code
 * @param accounts All accounts indexed by ID
 * @param bankCode SWIFT code to match (6 chars)
 * @returns Matching account or null
 */
export function matchAccountBySwift(
  accounts: AccountsById,
  bankCode: string
): TAccount | null {
  const swiftPrefix = bankCode.substring(0, 6).toUpperCase()

  for (const id in accounts) {
    const acc = accounts[id]
    if (acc.archive) continue
    if (acc.swiftCode?.toUpperCase() === swiftPrefix) {
      return acc
    }
  }
  return null
}

/**
 * Match account by bank account number
 * @param accounts All accounts indexed by ID
 * @param accountNumber Account number to match
 * @returns Matching account or null
 */
export function matchAccountByNumber(
  accounts: AccountsById,
  accountNumber: string
): TAccount | null {
  if (!accountNumber) return null

  for (const id in accounts) {
    const acc = accounts[id]
    if (acc.archive) continue

    // Exact match on bankAccountNumber
    if (acc.bankAccountNumber === accountNumber) {
      return acc
    }

    // Also check syncID array for partial matches
    if (acc.syncID?.some(syncId => accountNumber.includes(syncId))) {
      return acc
    }
  }
  return null
}

/**
 * Get all accounts matching a SWIFT code
 * (useful when user has multiple accounts in same bank)
 */
export function getAccountsBySwift(
  accounts: AccountsById,
  bankCode: string
): TAccount[] {
  const swiftPrefix = bankCode.substring(0, 6).toUpperCase()
  const result: TAccount[] = []

  for (const id in accounts) {
    const acc = accounts[id]
    if (acc.archive) continue
    if (acc.swiftCode?.toUpperCase() === swiftPrefix) {
      result.push(acc)
    }
  }
  return result
}

/**
 * Suggest best matching account for parsed statement
 * Priority: 1) Account number 2) SWIFT code
 */
export function suggestAccount(
  accounts: AccountsById,
  parseResult: TParseResult
): TAccount | null {
  // Try account number match first (most specific)
  if (parseResult.accountNumber) {
    const byNumber = matchAccountByNumber(accounts, parseResult.accountNumber)
    if (byNumber) return byNumber
  }

  // Try SWIFT match
  const bySwift = matchAccountBySwift(accounts, parseResult.bankCode)
  if (bySwift) return bySwift

  return null
}
