import React, { FC, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Divider,
  Button,
  Chip,
  Stack,
  InputAdornment,
} from '@mui/material'
import { SyncIcon } from '6-shared/ui/Icons'
import { useAppDispatch } from 'store'
import { AccountType } from '6-shared/types'
import type { TAccountPopulated } from '5-entities/account'
import { accountModel } from '5-entities/account'
import { sendEvent } from '6-shared/helpers/tracking'

type AccountSettingsProps = {
  account: TAccountPopulated
  onClose: () => void
}

export const AccountSettings: FC<AccountSettingsProps> = ({ account, onClose }) => {
  const { t } = useTranslation('accountSettings')
  const dispatch = useAppDispatch()

  // Form state
  const [title, setTitle] = useState(account.title)
  const [archive, setArchive] = useState(account.archive)
  const [isPrivate, setIsPrivate] = useState(account.private)
  const [inBalance, setInBalance] = useState(account.inBalance)
  const [savings, setSavings] = useState(account.savings)
  const [enableCorrection, setEnableCorrection] = useState(account.enableCorrection)
  const [swiftCode, setSwiftCode] = useState(account.swiftCode || '')
  const [bankAccountNumber, setBankAccountNumber] = useState(account.bankAccountNumber || '')
  const [startBalance, setStartBalance] = useState(account.startBalance?.toString() || '0')
  const [creditLimit, setCreditLimit] = useState(account.creditLimit?.toString() || '0')
  const [percent, setPercent] = useState(account.percent?.toString() || '')
  const [capitalization, setCapitalization] = useState(account.capitalization || false)

  const isLoanOrDeposit = account.type === AccountType.Loan || account.type === AccountType.Deposit

  const hasChanges = useCallback(() => {
    return (
      title !== account.title ||
      archive !== account.archive ||
      isPrivate !== account.private ||
      inBalance !== account.inBalance ||
      savings !== account.savings ||
      enableCorrection !== account.enableCorrection ||
      swiftCode !== (account.swiftCode || '') ||
      bankAccountNumber !== (account.bankAccountNumber || '') ||
      (isLoanOrDeposit && (
        parseFloat(startBalance) !== account.startBalance ||
        parseFloat(creditLimit) !== account.creditLimit ||
        parseFloat(percent) !== (account.percent || 0) ||
        capitalization !== (account.capitalization || false)
      ))
    )
  }, [
    title, archive, isPrivate, inBalance, savings, enableCorrection,
    swiftCode, bankAccountNumber, startBalance, creditLimit, percent,
    capitalization, account, isLoanOrDeposit
  ])

  const handleSave = () => {
    sendEvent('AccountSettings: save')

    const patch: Record<string, unknown> = {
      id: account.id,
      title,
      archive,
      private: isPrivate,
      inBalance,
      savings,
      enableCorrection,
      swiftCode: swiftCode || null,
      bankAccountNumber: bankAccountNumber || null,
    }

    if (isLoanOrDeposit) {
      patch.startBalance = parseFloat(startBalance) || 0
      patch.creditLimit = parseFloat(creditLimit) || 0
      patch.percent = parseFloat(percent) || null
      patch.capitalization = capitalization
    }

    dispatch(accountModel.patchAccount(patch as Parameters<typeof accountModel.patchAccount>[0]))
    onClose()
  }

  return (
    <Box sx={{ p: 2, pb: 4 }}>
      {/* Basic Section */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {t('sections.basic')}
      </Typography>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          label={t('fields.title')}
          value={title}
          onChange={e => setTitle(e.target.value)}
          fullWidth
          size="small"
        />
        <FormControlLabel
          control={
            <Switch
              checked={archive}
              onChange={e => setArchive(e.target.checked)}
            />
          }
          label={t('fields.archive')}
        />
        <FormControlLabel
          control={
            <Switch
              checked={isPrivate}
              onChange={e => setIsPrivate(e.target.checked)}
            />
          }
          label={t('fields.private')}
        />
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* Budget Section */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {t('sections.budget')}
      </Typography>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={inBalance}
              onChange={e => setInBalance(e.target.checked)}
            />
          }
          label={t('fields.inBalance')}
        />
        <FormControlLabel
          control={
            <Switch
              checked={savings}
              onChange={e => setSavings(e.target.checked)}
            />
          }
          label={t('fields.savings')}
        />
        <FormControlLabel
          control={
            <Switch
              checked={enableCorrection}
              onChange={e => setEnableCorrection(e.target.checked)}
            />
          }
          label={t('fields.enableCorrection')}
        />
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* Bank Import Section */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {t('sections.bankImport')}
      </Typography>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          label={t('fields.swiftCode')}
          value={swiftCode}
          onChange={e => setSwiftCode(e.target.value.toUpperCase().slice(0, 6))}
          fullWidth
          size="small"
          inputProps={{ maxLength: 6 }}
          helperText={t('fields.swiftCodeHint')}
        />
        <TextField
          label={t('fields.bankAccountNumber')}
          value={bankAccountNumber}
          onChange={e => setBankAccountNumber(e.target.value)}
          fullWidth
          size="small"
        />
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* Sync Status Section (Read-only) */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {t('sections.sync')}
      </Typography>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t('fields.syncedOnline')}:
          </Typography>
          {account.syncedOnline ? (
            <Chip
              icon={<SyncIcon />}
              label={t('syncBadge.synced')}
              size="small"
              color="primary"
            />
          ) : (
            <Chip
              label={t('syncBadge.local')}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {t('fields.syncedHint')}
        </Typography>

        {account.syncID && account.syncID.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Sync ID:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {account.syncID.map((id, index) => (
                <Chip key={index} label={id} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}
      </Stack>

      {/* Loan/Deposit Section (conditional) */}
      {isLoanOrDeposit && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            {t('sections.loanDeposit')}
          </Typography>
          <Stack spacing={2} sx={{ mb: 3 }}>
            <TextField
              label={t('fields.startBalance')}
              value={startBalance}
              onChange={e => setStartBalance(e.target.value)}
              fullWidth
              size="small"
              type="number"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">{account.fxCode}</InputAdornment>
                ),
              }}
            />
            <TextField
              label={t('fields.creditLimit')}
              value={creditLimit}
              onChange={e => setCreditLimit(e.target.value)}
              fullWidth
              size="small"
              type="number"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">{account.fxCode}</InputAdornment>
                ),
              }}
            />
            <TextField
              label={t('fields.percent')}
              value={percent}
              onChange={e => setPercent(e.target.value)}
              fullWidth
              size="small"
              type="number"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={capitalization}
                  onChange={e => setCapitalization(e.target.checked)}
                />
              }
              label={t('fields.capitalization')}
            />
            {account.startDate && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('fields.startDate')}: {account.startDate}
                </Typography>
              </Box>
            )}
          </Stack>
        </>
      )}

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!hasChanges()}
        >
          {t('save')}
        </Button>
      </Box>
    </Box>
  )
}
