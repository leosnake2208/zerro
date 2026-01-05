import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { ToggleButtonGroup, ToggleButton } from '@mui/material'
import { TrType } from '5-entities/transaction'

type TransactionTypeSwitchProps = {
  value: TrType
  onChange: (type: TrType) => void
  disabled?: boolean
}

export const TransactionTypeSwitch: FC<TransactionTypeSwitchProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const { t } = useTranslation('transactionEditor')

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: TrType | null
  ) => {
    if (newValue !== null) {
      onChange(newValue)
    }
  }

  // Normalize debt types for display (both incomeDebt and outcomeDebt show as debt)
  const displayValue =
    value === TrType.OutcomeDebt ? TrType.IncomeDebt : value

  return (
    <ToggleButtonGroup
      value={displayValue}
      exclusive
      onChange={handleChange}
      disabled={disabled}
      fullWidth
      size="small"
      sx={{
        '& .MuiToggleButton-root': {
          py: 0.5,
          textTransform: 'none',
          fontWeight: 500,
        },
      }}
    >
      <ToggleButton value={TrType.Income}>
        {t('typeSwitch.income')}
      </ToggleButton>
      <ToggleButton value={TrType.Outcome}>
        {t('typeSwitch.outcome')}
      </ToggleButton>
      <ToggleButton value={TrType.Transfer}>
        {t('typeSwitch.transfer')}
      </ToggleButton>
      <ToggleButton value={TrType.IncomeDebt}>
        {t('typeSwitch.debt')}
      </ToggleButton>
    </ToggleButtonGroup>
  )
}
