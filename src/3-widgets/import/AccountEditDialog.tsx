import React, { FC, useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { registerPopover } from '6-shared/historyPopovers'
import { useAppDispatch } from 'store'
import { accountModel } from '5-entities/account'
import type { TAccountId } from '6-shared/types'

type AccountEditDialogProps = {
  accountId: TAccountId
}

const dialogHooks = registerPopover<AccountEditDialogProps>(
  'accountEditDialog',
  { accountId: '' }
)

export const useAccountEditDialog = () => {
  const { open } = dialogHooks.useMethods()
  return useCallback(
    (accountId: TAccountId) => open({ accountId }),
    [open]
  )
}

export const AccountEditDialog: FC = () => {
  const { t } = useTranslation('accountEdit')
  const { displayProps, extraProps } = dialogHooks.useProps()
  const dispatch = useAppDispatch()
  const accounts = accountModel.useAccounts()
  const account = accounts[extraProps.accountId]

  const [swiftCode, setSwiftCode] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [syncedOnline, setSyncedOnline] = useState(false)

  // Update state when account changes
  useEffect(() => {
    if (account) {
      setSwiftCode(account.swiftCode || '')
      setBankAccountNumber(account.bankAccountNumber || '')
      setSyncedOnline(account.syncedOnline || false)
    }
  }, [account])

  const handleSwiftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only first 6 chars, uppercase
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setSwiftCode(value)
  }

  const handleSave = () => {
    if (!account) return

    dispatch(
      accountModel.patchAccount({
        id: account.id,
        swiftCode: swiftCode || null,
        bankAccountNumber: bankAccountNumber || null,
        syncedOnline,
      })
    )
    displayProps.onClose()
  }

  if (!account) return null

  return (
    <Dialog
      open={displayProps.open}
      onClose={displayProps.onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        {t('editAccount')}: {account.title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label={t('swiftCode')}
            value={swiftCode}
            onChange={handleSwiftChange}
            placeholder="INSJAM"
            helperText={t('swiftCodeHelp')}
            inputProps={{ maxLength: 6 }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('bankAccountNumber')}
            value={bankAccountNumber}
            onChange={e => setBankAccountNumber(e.target.value)}
            helperText={t('bankAccountNumberHelp')}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={syncedOnline}
                onChange={e => setSyncedOnline(e.target.checked)}
              />
            }
            label={t('syncedOnline')}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={displayProps.onClose}>{t('cancel')}</Button>
        <Button onClick={handleSave} variant="contained">
          {t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
