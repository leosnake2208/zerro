import React, { FC } from 'react'
import { Box } from '@mui/material'
import type { TAccountId } from '6-shared/types'
import { ImportHistory } from '3-widgets/import/ImportHistory'
import { ImportButton } from '3-widgets/import/ImportButton'

type ImportHistoryTabProps = {
  accountId: TAccountId
}

export const ImportHistoryTab: FC<ImportHistoryTabProps> = ({ accountId }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <ImportButton accountId={accountId} />
      </Box>
      <ImportHistory accountId={accountId} />
    </Box>
  )
}
