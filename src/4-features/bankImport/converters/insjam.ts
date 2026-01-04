import type { TISODate } from '6-shared/types'
import type { TBankConverter, TParseResult, TParsedTransaction } from './types'

/**
 * Parse date from DD/MM/YYYY format to ISO date
 */
function parseDate(dateStr: string): TISODate {
  const [day, month, year] = dateStr.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` as TISODate
}

/**
 * Parse period string [DD/MM/YYYY] - [DD/MM/YYYY]
 */
function parsePeriod(periodStr: string): [TISODate, TISODate] {
  const match = periodStr.match(/\[(\d{2}\/\d{2}\/\d{4})\] - \[(\d{2}\/\d{2}\/\d{4})\]/)
  if (!match) {
    throw new Error(`Invalid period format: ${periodStr}`)
  }
  return [parseDate(match[1]), parseDate(match[2])]
}

/**
 * Parse amount - remove comma thousand separators
 */
function parseAmount(amountStr: string): number {
  return parseFloat(amountStr.replace(/,/g, ''))
}

/**
 * Get text content of an element
 */
function getText(parent: Element, tagName: string): string {
  return parent.querySelector(tagName)?.textContent || ''
}

/**
 * Inecobank (Armenia) XML statement converter
 * SWIFT: INSJAM
 */
export const insjamConverter: TBankConverter = {
  bankCode: 'INSJAM',
  bankName: 'Inecobank (Armenia)',
  supportedFormats: ['xml'],

  detect: (content: string, fileName: string): boolean => {
    // Check for Inecobank XML structure
    const hasStatement = content.includes('<statement')
    const hasAccountNumber = content.includes('<AccountNumber>')
    const hasOperations = content.includes('<Operations>')
    return hasStatement && hasAccountNumber && hasOperations
  },

  parse: (content: string): TParseResult => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/xml')

    // Check for parsing errors
    const parseError = doc.querySelector('parsererror')
    if (parseError) {
      throw new Error('Invalid XML format')
    }

    const root = doc.documentElement

    // Extract account info
    const accountNumber = getText(root, 'AccountNumber')
    const currency = getText(root, 'Currency') || 'USD'
    const periodStr = getText(root, 'Period')

    const [dateStart, dateEnd] = parsePeriod(periodStr)

    // Parse operations
    const transactions: TParsedTransaction[] = []
    const operations = root.querySelectorAll('Operations Operation')

    operations.forEach(op => {
      const fitId = getText(op, 'n-n')
      const dateStr = getText(op, 'Date')
      const incomeStr = getText(op, 'Income')
      const expenseStr = getText(op, 'Expense')
      const payee = getText(op, 'Receiver-Payer')
      const details = getText(op, 'Details')

      const income = parseAmount(incomeStr)
      const expense = parseAmount(expenseStr)

      // Determine amount (positive for income, negative for expense)
      const amount = income > 0 ? income : -expense

      transactions.push({
        fitId,
        date: parseDate(dateStr),
        amount,
        currency,
        payee: payee.substring(0, 32), // OFX NAME limit
        memo: details.substring(0, 255), // OFX MEMO limit
        accountNumber,
      })
    })

    return {
      bankCode: 'INSJAM',
      accountNumber,
      currency,
      dateStart,
      dateEnd,
      transactions,
    }
  },
}
