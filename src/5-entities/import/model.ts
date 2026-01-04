import { useState, useEffect, useCallback } from 'react'
import { importStorage } from './storage'
import type { TImportRecord, TImportId } from './types'
import type { TAccountId } from '6-shared/types'

/**
 * Hook to get all import records
 * Re-renders when imports change (via custom event)
 */
export function useImports(): TImportRecord[] {
  const [imports, setImports] = useState<TImportRecord[]>(() =>
    importStorage.get()
  )

  useEffect(() => {
    const handleUpdate = () => {
      setImports(importStorage.get())
    }

    window.addEventListener('zerro:imports-updated', handleUpdate)
    return () => {
      window.removeEventListener('zerro:imports-updated', handleUpdate)
    }
  }, [])

  return imports
}

/**
 * Hook to get imports for a specific account
 */
export function useAccountImports(accountId: TAccountId): TImportRecord[] {
  const imports = useImports()
  return imports.filter(i => i.accountId === accountId)
}

/**
 * Notify listeners that imports have changed
 */
function notifyImportsChanged(): void {
  window.dispatchEvent(new CustomEvent('zerro:imports-updated'))
}

/**
 * Add import record
 */
export function addImportRecord(record: TImportRecord): void {
  importStorage.add(record)
  notifyImportsChanged()
}

/**
 * Remove import record
 */
export function removeImportRecord(importId: TImportId): void {
  importStorage.remove(importId)
  notifyImportsChanged()
}

/**
 * Import entity model
 */
export const importModel = {
  // Hooks
  useImports,
  useAccountImports,

  // Actions
  addImportRecord,
  removeImportRecord,

  // Direct storage access
  storage: importStorage,
}
