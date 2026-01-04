import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Chip, Typography } from '@mui/material'
import { Amount } from '6-shared/ui/Amount'
import { SyncIcon } from '6-shared/ui/Icons'
import type { TAccountPopulated } from '5-entities/account'
import { AccountType } from '6-shared/types'

type AccountHeaderProps = {
  account: TAccountPopulated
}

type TypeKey = 'types.cash' | 'types.card' | 'types.checking' | 'types.loan' | 'types.deposit' | 'types.emoney' | 'types.debt'

const accountTypeLabels: Record<AccountType, TypeKey> = {
  [AccountType.Cash]: 'types.cash',
  [AccountType.Ccard]: 'types.card',
  [AccountType.Checking]: 'types.checking',
  [AccountType.Loan]: 'types.loan',
  [AccountType.Deposit]: 'types.deposit',
  [AccountType.Emoney]: 'types.emoney',
  [AccountType.Debt]: 'types.debt',
}

export const AccountHeader: FC<AccountHeaderProps> = ({ account }) => {
  const { t } = useTranslation('accountSettings')

  return (
    <Box
      sx={{
        px: 2,
        py: 2,
        bgcolor: 'action.hover',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {/* Title and Balance */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
        <Typography
          variant="h5"
          sx={{
            flexGrow: 1,
            textDecoration: account.archive ? 'line-through' : 'none',
            opacity: account.archive ? 0.6 : 1,
          }}
          noWrap
        >
          {account.title}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            ml: 2,
            flexShrink: 0,
            color: account.balance < 0 ? 'error.main' : 'text.primary',
          }}
        >
          <Amount
            value={account.balance}
            currency={account.fxCode}
            noShade
          />
        </Typography>
      </Box>

      {/* Badges */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {/* Account Type */}
        <Chip
          label={t(accountTypeLabels[account.type])}
          size="small"
          variant="outlined"
        />

        {/* Sync Status */}
        {account.syncedOnline && (
          <Chip
            icon={<SyncIcon />}
            label={t('syncBadge.synced')}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}

        {/* Archived */}
        {account.archive && (
          <Chip
            label={t('fields.archive')}
            size="small"
            color="warning"
            variant="outlined"
          />
        )}

        {/* In Budget */}
        {account.inBudget && (
          <Chip
            label={t('fields.inBalance')}
            size="small"
            color="success"
            variant="outlined"
          />
        )}
      </Box>
    </Box>
  )
}
