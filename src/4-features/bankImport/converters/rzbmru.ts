import type { TISODate } from '6-shared/types'
import type { TBankConverter, TParseResult, TParsedTransaction } from './types'

/**
 * Parse Russian number format (space as thousand separator, comma as decimal)
 */
function parseRussianNumber(str: string): number {
  if (!str || str.trim() === '') return 0
  // Remove spaces and replace comma with dot
  const cleaned = str.replace(/\s/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

/**
 * Parse date from DD.MM.YYYY format to ISO date
 */
function parseRussianDate(dateStr: string): TISODate {
  const datePart = dateStr.split(' ')[0] // Remove time if present
  const [day, month, year] = datePart.split('.')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` as TISODate
}

/**
 * Parse CSV line with semicolon delimiter, handling quoted values
 */
function parseCSVLine(line: string, delimiter: string = ';'): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())

  return result
}

/**
 * Extract payee from memo (first meaningful part)
 */
function extractPayee(memo: string): string {
  // Take first 32 chars or up to first significant delimiter
  const cleaned = memo.replace(/\s+/g, ' ').trim()
  return cleaned.substring(0, 32)
}

/**
 * Raiffeisen Bank (Russia) CSV statement converter
 * SWIFT: RZBMRU
 */
export const rzbmruConverter: TBankConverter = {
  bankCode: 'RZBMRU',
  bankName: 'Raiffeisen Bank (Russia)',
  supportedFormats: ['csv'],

  detect: (content: string, fileName: string): boolean => {
    const firstLine = content.split('\n')[0].toLowerCase()
    // Check for Raiffeisen CSV header patterns (Russian or English)
    return (
      firstLine.includes('date and time') ||
      firstLine.includes('дата и время') ||
      firstLine.includes('дата;номер документа') ||
      (firstLine.includes('дата') && firstLine.includes('приход'))
    )
  },

  parse: (content: string): TParseResult => {
    const lines = content.split('\n')
    const transactions: TParsedTransaction[] = []

    // Normalize header to English
    const header = lines[0].toLowerCase()
    const isRussianHeader =
      header.includes('дата и время') || header.includes('дата;')

    // Determine column indices based on header
    // Expected columns: date and time, date, document number, incomes, expenses, currency, details, card number
    // Or Russian: Дата и время, Дата, Номер документа, Приход, Расход, Валюта, Описание, Номер карты

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const fields = parseCSVLine(line, ';')
      if (fields.length < 7) continue

      // Parse fields based on expected format
      // Index: 0=datetime, 1=date, 2=docnum, 3=income, 4=expense, 5=currency, 6=details, 7=card
      const dateTimeStr = fields[0]
      const dateStr = fields[1]
      const docNum = fields[2]
      const income = parseRussianNumber(fields[3])
      const expense = parseRussianNumber(fields[4])
      const currency = fields[5] || 'RUB'
      const memo = fields[6] || ''

      // Use date field, fallback to datetime
      const transactionDate = dateStr
        ? parseRussianDate(dateStr)
        : parseRussianDate(dateTimeStr)

      // Determine amount
      const amount = income > 0 ? income : -expense

      // Skip zero-amount transactions
      if (amount === 0) continue

      transactions.push({
        fitId: docNum || `${dateTimeStr}_${i}`,
        date: transactionDate,
        amount,
        currency,
        payee: extractPayee(memo),
        memo,
      })
    }

    // Calculate date range
    const dates = transactions.map(t => t.date).sort()
    const dateStart = dates[0] || ('' as TISODate)
    const dateEnd = dates[dates.length - 1] || ('' as TISODate)

    return {
      bankCode: 'RZBMRU',
      accountNumber: '', // CSV doesn't contain account number
      currency: 'RUB',
      dateStart,
      dateEnd,
      transactions,
    }
  },
}
