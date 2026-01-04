import React, { FC, useCallback } from 'react'
import { Box } from '@mui/material'
import type { TAccountId } from '6-shared/types'
import { TransactionList } from '3-widgets/transaction/TransactionList'
import { useTransactionPreview } from '3-widgets/global/TransactionPreviewDrawer'

type AccountTransactionsProps = {
  accountId: TAccountId
}

export const AccountTransactions: FC<AccountTransactionsProps> = ({ accountId }) => {
  const trPreview = useTransactionPreview()

  const showTransaction = useCallback(
    (id: string) => {
      trPreview.open({
        id,
        onOpenOther: (otherId: string) => {
          trPreview.close()
          showTransaction(otherId)
        },
        onSelectSimilar: () => {
          // Not implemented for account view
        },
      })
    },
    [trPreview]
  )

  return (
    <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
      <TransactionList
        preFilter={{ account: accountId }}
        onTrOpen={showTransaction}
        sx={{ flex: '1 1 auto' }}
      />
    </Box>
  )
}
