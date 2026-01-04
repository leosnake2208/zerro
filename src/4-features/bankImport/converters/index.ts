import { insjamConverter } from './insjam'
import { rzbmruConverter } from './rzbmru'
import type { TBankConverter, TParseResult } from './types'

/**
 * Registry of all available bank converters
 */
export const converters: TBankConverter[] = [insjamConverter, rzbmruConverter]

/**
 * Detect bank by file content
 * @param content File content as string
 * @param fileName Original file name
 * @returns Matching converter or null
 */
export function detectBank(
  content: string,
  fileName: string
): TBankConverter | null {
  for (const converter of converters) {
    if (converter.detect(content, fileName)) {
      return converter
    }
  }
  return null
}

/**
 * Parse bank statement file
 * @param content File content as string
 * @param fileName Original file name
 * @returns Parse result or null if format not supported
 */
export function parseStatement(
  content: string,
  fileName: string
): TParseResult | null {
  const converter = detectBank(content, fileName)
  if (!converter) return null
  return converter.parse(content)
}

/**
 * Get converter by bank code
 * @param bankCode SWIFT code prefix (6 chars)
 * @returns Matching converter or null
 */
export function getConverterByCode(bankCode: string): TBankConverter | null {
  return converters.find(c => c.bankCode === bankCode) || null
}

/**
 * Get list of supported banks for UI
 */
export function getSupportedBanks(): Array<{
  code: string
  name: string
  formats: string[]
}> {
  return converters.map(c => ({
    code: c.bankCode,
    name: c.bankName,
    formats: c.supportedFormats,
  }))
}

export type { TBankConverter, TParseResult, TParsedTransaction } from './types'
