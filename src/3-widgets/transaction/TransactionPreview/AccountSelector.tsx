import React, { FC, useMemo } from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import type { TAccountId, AccountType } from '6-shared/types'
import { accountModel } from '5-entities/account'
import { AccountBalanceWalletIcon } from '6-shared/ui/Icons'

type AccountSelectorProps = {
  value: TAccountId
  onChange: (id: TAccountId) => void
  excludeAccount?: TAccountId
  excludeType?: AccountType
  label: string
}

export const AccountSelector: FC<AccountSelectorProps> = ({
  value,
  onChange,
  excludeAccount,
  excludeType,
  label,
}) => {
  const accounts = accountModel.usePopulatedAccounts()

  const sortedAccounts = useMemo(() => {
    return Object.values(accounts)
      .filter(acc => {
        if (acc.archive) return false
        // Don't exclude the currently selected account
        if (acc.id === value) return true
        if (excludeAccount && acc.id === excludeAccount) return false
        if (excludeType && acc.type === excludeType) return false
        return true
      })
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [accounts, excludeAccount, excludeType, value])

  const handleChange = (event: { target: { value: unknown } }) => {
    onChange(event.target.value as TAccountId)
  }

  return (
    <FormControl fullWidth size="small">
      <InputLabel>{label}</InputLabel>
      <Select value={value} onChange={handleChange} label={label}>
        {sortedAccounts.map(account => (
          <MenuItem key={account.id} value={account.id}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <AccountBalanceWalletIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={account.title}
              secondary={`${account.balance.toLocaleString()} ${account.fxCode}`}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
