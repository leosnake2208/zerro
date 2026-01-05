import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Autocomplete,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Stack,
} from '@mui/material'
import type { TAccountId, TFxAmount } from '6-shared/types'
import { debtorModel, TDebtor } from '5-entities/debtors'
import { accountModel, TAccountPopulated } from '5-entities/account'
import { AccountSelector } from './AccountSelector'
import { AmountInput } from '6-shared/ui/AmountInput'
import { AccountType } from '6-shared/types'

export type DebtDirection = 'lend' | 'getRepayment' | 'borrow' | 'repayDebt'

type DebtEditorProps = {
  direction: DebtDirection
  onDirectionChange: (dir: DebtDirection) => void
  debtorName: string
  onDebtorChange: (name: string) => void
  amount: number
  onAmountChange: (amount: number) => void
  account: TAccountId
  onAccountChange: (id: TAccountId) => void
  currency?: string
}

export const DebtEditor: FC<DebtEditorProps> = ({
  direction,
  onDirectionChange,
  debtorName,
  onDebtorChange,
  amount,
  onAmountChange,
  account,
  onAccountChange,
  currency,
}) => {
  const { t } = useTranslation('transactionEditor')
  const debtors = debtorModel.useDebtors()

  // Get list of debtor names for autocomplete
  const debtorOptions = useMemo(() => {
    return Object.values(debtors).map(d => d.name)
  }, [debtors])

  // Find current debtor to show balance
  const currentDebtor = useMemo(() => {
    return Object.values(debtors).find(
      d => d.name.toLowerCase() === debtorName.toLowerCase()
    )
  }, [debtors, debtorName])

  const handleDirectionChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: DebtDirection | null
  ) => {
    if (newValue !== null) {
      onDirectionChange(newValue)
    }
  }

  return (
    <Stack spacing={2}>
      {/* Direction toggle */}
      <ToggleButtonGroup
        value={direction}
        exclusive
        onChange={handleDirectionChange}
        fullWidth
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            py: 0.5,
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.75rem',
          },
        }}
      >
        <ToggleButton value="lend">{t('debt.lend')}</ToggleButton>
        <ToggleButton value="getRepayment">
          {t('debt.getRepayment')}
        </ToggleButton>
        <ToggleButton value="borrow">{t('debt.borrow')}</ToggleButton>
        <ToggleButton value="repayDebt">{t('debt.repayDebt')}</ToggleButton>
      </ToggleButtonGroup>

      {/* Debtor autocomplete */}
      <Autocomplete
        freeSolo
        options={debtorOptions}
        value={debtorName}
        onChange={(_event, newValue) => onDebtorChange(newValue || '')}
        onInputChange={(_event, newValue) => onDebtorChange(newValue)}
        renderInput={params => (
          <TextField
            {...params}
            label={t('debt.debtor')}
            size="small"
            fullWidth
          />
        )}
      />

      {/* Account selector (excluding debt account) */}
      <AccountSelector
        value={account}
        onChange={onAccountChange}
        excludeType={AccountType.Debt}
        label={t('debt.account')}
      />

      {/* Amount input */}
      <AmountInput
        label={t('debt.amount')}
        currency={currency}
        value={amount}
        onChange={onAmountChange}
        selectOnFocus
        fullWidth
        size="small"
      />

      {/* Current balance with this debtor */}
      {currentDebtor && Object.keys(currentDebtor.balance).length > 0 && (
        <Box
          sx={{
            p: 1.5,
            bgcolor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {t('debt.currentBalance', { name: currentDebtor.name })}:
          </Typography>
          <BalanceDisplay balance={currentDebtor.balance} />
        </Box>
      )}
    </Stack>
  )
}

const BalanceDisplay: FC<{ balance: TFxAmount }> = ({ balance }) => {
  const { t } = useTranslation('transactionEditor')

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {Object.entries(balance).map(([currency, value]) => {
        const isPositive = value > 0
        return (
          <Typography
            key={currency}
            variant="body2"
            sx={{
              fontWeight: 500,
              color: isPositive ? 'success.main' : 'error.main',
            }}
          >
            {isPositive ? '+' : ''}
            {value.toLocaleString()} {currency}
            <Typography
              component="span"
              variant="caption"
              sx={{ ml: 0.5, color: 'text.secondary' }}
            >
              ({isPositive ? t('debt.theyOweYou') : t('debt.youOweThem')})
            </Typography>
          </Typography>
        )
      })}
    </Stack>
  )
}
