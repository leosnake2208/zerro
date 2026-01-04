import type { TImportRecord } from './types'

const STORAGE_KEY = 'zerro_import_history'
const MAX_RECORDS = 100 // Keep last 100 imports

/**
 * Local storage for import history
 * (not synced with ZenMoney as it's local-only feature)
 */
export const importStorage = {
  /**
   * Get all import records
   */
  get(): TImportRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  /**
   * Save import records
   */
  save(records: TImportRecord[]): void {
    try {
      // Keep only last MAX_RECORDS
      const trimmed = records.slice(0, MAX_RECORDS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch (e) {
      console.error('Failed to save import history:', e)
    }
  },

  /**
   * Add new import record (prepends to list)
   */
  add(record: TImportRecord): void {
    const records = importStorage.get()
    records.unshift(record)
    importStorage.save(records)
  },

  /**
   * Remove import record by ID
   */
  remove(importId: string): void {
    const records = importStorage.get()
    const filtered = records.filter(r => r.id !== importId)
    importStorage.save(filtered)
  },

  /**
   * Clear all import history
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  },
}
