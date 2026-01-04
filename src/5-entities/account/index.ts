import { useAppSelector } from 'store/index'
import type { TAccountId } from '6-shared/types'
import {
  getAccountList,
  getAccounts,
  getDebtAccountId,
  getInBudgetAccounts,
  getPopulatedAccounts,
  getSavingAccounts,
} from './selectors'
import { makeAccount } from './shared/makeAccount'
import { patchAccount, setInBudget } from './thunks'

export type { TAccountPatch } from './thunks'
export type { TAccountDraft } from './shared/makeAccount'
export type { TAccountPopulated } from './shared/populate'

export const accountModel = {
  getAccounts,
  getDebtAccountId,
  getPopulatedAccounts,
  getAccountList,
  getInBudgetAccounts,
  getSavingAccounts,
  // Hooks
  useAccounts: () => useAppSelector(getAccounts),
  useDebtAccountId: () => useAppSelector(getDebtAccountId),
  usePopulatedAccounts: () => useAppSelector(getPopulatedAccounts),
  usePopulatedAccount: (id: TAccountId) =>
    useAppSelector(state => getPopulatedAccounts(state)[id]),
  useAccountList: () => useAppSelector(getAccountList),
  useInBudgetAccounts: () => useAppSelector(getInBudgetAccounts),
  useSavingAccounts: () => useAppSelector(getSavingAccounts),
  // Actions
  makeAccount,
  // Thunks
  patchAccount,
  setInBudget,
}
