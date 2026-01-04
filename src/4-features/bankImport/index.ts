// Converters
export {
  detectBank,
  parseStatement,
  getConverterByCode,
  getSupportedBanks,
  converters,
} from './converters'
export type {
  TBankConverter,
  TParseResult,
  TParsedTransaction,
} from './converters'

// Account matching
export {
  matchAccountBySwift,
  matchAccountByNumber,
  getAccountsBySwift,
  suggestAccount,
} from './matchAccount'

// Import thunk
export {
  importStatement,
  previewImport,
} from './importStatementThunk'
export type { TImportOptions, TImportResult } from './importStatementThunk'
