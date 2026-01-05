import { v1 as uuidv1 } from 'uuid'
import { sendEvent } from '6-shared/helpers/tracking'
import { AppThunk } from 'store'
import {
  OptionalExceptFor,
  TTagId,
  TTransaction,
  TTransactionId,
} from '6-shared/types'
import { applyClientPatch } from 'store/data'
import { getTransactionsById } from './model'
import { isViewed } from './helpers'

export const deleteTransactions =
  (ids: TTransactionId | TTransactionId[]): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Transaction: delete')
    const array = Array.isArray(ids) ? ids : [ids]
    const deleted = array.map(id => ({
      ...getTransactionsById(getState())[id],
      deleted: true,
      changed: Date.now(),
    }))
    dispatch(applyClientPatch({ transaction: deleted }))
  }

export const deleteTransactionsPermanently =
  (ids: TTransactionId | TTransactionId[]): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Transaction: delete permanently')
    const array = Array.isArray(ids) ? ids : [ids]
    const deleted = array.map(id => ({
      ...getTransactionsById(getState())[id],
      outcome: 0.00001,
      income: 0.00001,
      changed: Date.now(),
    }))
    dispatch(applyClientPatch({ transaction: deleted }))
  }

export const markViewed =
  (ids: TTransactionId | TTransactionId[], viewed: boolean): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent(`Transaction: mark viewed: ${viewed}`)
    const array = Array.isArray(ids) ? ids : [ids]
    const state = getState()
    const transactions = getTransactionsById(state)
    const result = array
      .filter(id => isViewed(transactions[id]) !== viewed)
      .map(id => ({
        ...transactions[id],
        viewed,
        changed: Date.now(),
      }))
    dispatch(applyClientPatch({ transaction: result }))
  }

export const restoreTransaction =
  (id: TTransactionId): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Transaction: restore')
    const tr = {
      ...getTransactionsById(getState())[id],
      deleted: false,
      changed: Date.now(),
      id: uuidv1(),
    }
    dispatch(applyClientPatch({ transaction: [tr] }))
  }

// Не работает
// TODO: Надо для новых транзакций сразу проставлять категорию. Иначе они обратно схлопываются
export const splitTransfer =
  (id: TTransactionId): AppThunk<void> =>
  (dispatch, getState) => {
    const state = getState()
    const tr = getTransactionsById(state)[id]
    const list = split(tr)
    if (list) dispatch(applyClientPatch({ transaction: list }))
  }

export type TransactionPatch = OptionalExceptFor<TTransaction, 'id'>
export const applyChangesToTransaction =
  (patch: TransactionPatch): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Transaction: edit')
    const tr = {
      ...getTransactionsById(getState())[patch.id],
      ...patch,
      changed: Date.now(),
    }
    dispatch(applyClientPatch({ transaction: [tr] }))
  }

export const recreateTransaction =
  (patch: TransactionPatch): AppThunk<string> =>
  (dispatch, getState) => {
    sendEvent('Transaction: recreate')
    const tr = getTransactionsById(getState())[patch.id]
    const oldTr = {
      ...tr,
      outcome: 0.00001,
      income: 0.00001,
      changed: Date.now(),
    }
    const newTr = {
      ...getTransactionsById(getState())[patch.id],
      ...patch,
      id: uuidv1(),
      changed: Date.now(),
    }
    dispatch(applyClientPatch({ transaction: [oldTr, newTr] }))
    return newTr.id
  }

export const bulkEditTransactions =
  (
    ids: TTransactionId[],
    opts: { tags?: TTagId[]; comment?: string }
  ): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Bulk Actions: set new tags')
    const state = getState()
    const allTransactions = getTransactionsById(state)

    const result = ids.map(id => {
      const tr = allTransactions[id]
      const tag = modifyTags(tr.tag, opts.tags)
      const comment = modifyComment(tr.comment, opts.comment)
      return { ...tr, tag, comment, changed: Date.now() }
    })
    dispatch(applyClientPatch({ transaction: result }))
  }

const modifyTags = (prevTags: string[] | null, newTags?: string[]) => {
  if (!newTags) return prevTags
  let result: TTagId[] = []
  const addId = (id: string) =>
    result.includes(id) || id === 'null' ? '' : result.push(id)
  newTags?.forEach(id => {
    if (id === 'mixed' && prevTags) prevTags.forEach(addId)
    else addId(id)
  })
  return result
}
const modifyComment = (prevComment: string | null, newComment?: string) => {
  if (!newComment) return prevComment
  return newComment.replaceAll('$&', prevComment || '')
}

function split(raw: TTransaction) {
  if (!(raw.income && raw.outcome)) return null
  const result: TTransaction[] = [
    {
      ...raw,
      changed: Date.now(),
      income: 0,
      incomeInstrument: raw.outcomeInstrument,
      incomeAccount: raw.outcomeAccount,
      opIncome: null,
      opIncomeInstrument: null,
      incomeBankID: null,
    },
    {
      ...raw,
      changed: Date.now(),
      id: uuidv1(),
      outcome: 0,
      outcomeInstrument: raw.incomeInstrument,
      outcomeAccount: raw.incomeAccount,
      opOutcome: null,
      opOutcomeInstrument: null,
      outcomeBankID: null,
    },
  ]
  return result
}

/**
 * Links two separate transactions (one income, one outcome) into a single transfer.
 * The source transaction determines date/payee/comment, and both are marked as deleted.
 */
export const linkTransactionsAsTransfer =
  (sourceId: TTransactionId, targetId: TTransactionId): AppThunk<string> =>
  (dispatch, getState) => {
    sendEvent('Transaction: link as transfer')
    const state = getState()
    const allTransactions = getTransactionsById(state)
    const source = allTransactions[sourceId]
    const target = allTransactions[targetId]

    if (!source || !target) {
      throw new Error('Transaction not found')
    }

    // Determine which is income and which is outcome
    let incomeSource: TTransaction
    let outcomeSource: TTransaction

    if (source.income > 0 && !source.outcome) {
      // Source is income
      incomeSource = source
      outcomeSource = target
    } else if (source.outcome > 0 && !source.income) {
      // Source is outcome
      incomeSource = target
      outcomeSource = source
    } else {
      // Source is already a transfer or has both, use as income
      incomeSource = source
      outcomeSource = target
    }

    // Create the new combined transfer transaction
    const newTr: TTransaction = {
      ...incomeSource,
      id: uuidv1(),
      changed: Date.now(),
      // Income side from income source
      income: incomeSource.income,
      incomeAccount: incomeSource.incomeAccount,
      incomeInstrument: incomeSource.incomeInstrument,
      incomeBankID: incomeSource.incomeBankID,
      // Outcome side from outcome source
      outcome: outcomeSource.outcome,
      outcomeAccount: outcomeSource.outcomeAccount,
      outcomeInstrument: outcomeSource.outcomeInstrument,
      outcomeBankID: outcomeSource.outcomeBankID,
      // Use primary source's metadata
      date: source.date,
      payee: source.payee || target.payee,
      comment: source.comment || target.comment,
      tag: null, // Transfers don't have tags
      // Clear op amounts as they're not relevant for user-linked transfers
      opIncome: null,
      opIncomeInstrument: null,
      opOutcome: null,
      opOutcomeInstrument: null,
    }

    // Mark both original transactions as deleted
    const deletedSource = {
      ...source,
      outcome: 0.00001,
      income: 0.00001,
      changed: Date.now(),
    }
    const deletedTarget = {
      ...target,
      outcome: 0.00001,
      income: 0.00001,
      changed: Date.now(),
    }

    dispatch(
      applyClientPatch({ transaction: [deletedSource, deletedTarget, newTr] })
    )
    return newTr.id
  }
