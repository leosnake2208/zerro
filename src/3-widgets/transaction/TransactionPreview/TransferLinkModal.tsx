import React, { FC, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Chip,
  Stack,
} from '@mui/material'
import type { TTransaction, TTransactionId } from '6-shared/types'
import { formatDate, parseDate } from '6-shared/helpers/date'
import { formatMoney, rateToWords } from '6-shared/helpers/money'
import { useAppDispatch } from 'store'
import { trModel, TrType } from '5-entities/transaction'
import { accountModel } from '5-entities/account'
import { instrumentModel } from '5-entities/currency/instrument'

type TransferLinkModalProps = {
  open: boolean
  onClose: () => void
  sourceTransaction: TTransaction
  onLinked: (newId: TTransactionId) => void
}

export const TransferLinkModal: FC<TransferLinkModalProps> = ({
  open,
  onClose,
  sourceTransaction,
  onLinked,
}) => {
  const { t } = useTranslation('transactionEditor')
  const dispatch = useAppDispatch()
  const [selectedId, setSelectedId] = useState<TTransactionId | null>(null)

  const transactions = trModel.useTransactions()
  const accounts = accountModel.usePopulatedAccounts()
  const instruments = instrumentModel.useInstruments()
  const getTrType = trModel.useTrTypeGetter()

  const sourceType = getTrType(sourceTransaction)
  const isSourceIncome =
    sourceType === TrType.Income ||
    (sourceType === TrType.Transfer && sourceTransaction.income > 0)

  // Find candidate transactions for linking
  const candidates = useMemo(() => {
    const sourceDate = parseDate(sourceTransaction.date)
    const oneDayMs = 24 * 60 * 60 * 1000

    return Object.values(transactions)
      .filter(tr => {
        // Skip self
        if (tr.id === sourceTransaction.id) return false

        // Skip deleted
        if (tr.deleted) return false

        // Skip transfers (already linked)
        const trType = getTrType(tr)
        if (trType === TrType.Transfer) return false

        // Must be opposite type
        if (isSourceIncome) {
          if (trType !== TrType.Outcome) return false
        } else {
          if (trType !== TrType.Income) return false
        }

        // Must be within ±1 day
        const trDate = parseDate(tr.date)
        const dateDiff = Math.abs(sourceDate.getTime() - trDate.getTime())
        if (dateDiff > oneDayMs) return false

        // Different account
        if (isSourceIncome) {
          if (tr.outcomeAccount === sourceTransaction.incomeAccount)
            return false
        } else {
          if (tr.incomeAccount === sourceTransaction.outcomeAccount)
            return false
        }

        return true
      })
      .sort((a, b) => {
        // Sort by amount similarity (closer = better)
        const sourceAmount = isSourceIncome
          ? sourceTransaction.income
          : sourceTransaction.outcome
        const aAmount = isSourceIncome ? a.outcome : a.income
        const bAmount = isSourceIncome ? b.outcome : b.income
        const aDiff = Math.abs(sourceAmount - aAmount) / sourceAmount
        const bDiff = Math.abs(sourceAmount - bAmount) / sourceAmount
        return aDiff - bDiff
      })
      .slice(0, 10) // Limit to 10 candidates
  }, [transactions, sourceTransaction, getTrType, isSourceIncome])

  const selectedTransaction = selectedId ? transactions[selectedId] : null

  // Calculate exchange rate if currencies differ
  const exchangeRateInfo = useMemo(() => {
    if (!selectedTransaction) return null

    const sourceInst = isSourceIncome
      ? sourceTransaction.incomeInstrument
      : sourceTransaction.outcomeInstrument
    const targetInst = isSourceIncome
      ? selectedTransaction.outcomeInstrument
      : selectedTransaction.incomeInstrument

    if (sourceInst === targetInst) return null

    const sourceAmount = isSourceIncome
      ? sourceTransaction.income
      : sourceTransaction.outcome
    const targetAmount = isSourceIncome
      ? selectedTransaction.outcome
      : selectedTransaction.income

    const sourceCurrency = instruments[sourceInst]?.shortTitle || ''
    const targetCurrency = instruments[targetInst]?.shortTitle || ''

    return rateToWords(sourceAmount, sourceCurrency, targetAmount, targetCurrency)
  }, [selectedTransaction, sourceTransaction, isSourceIncome, instruments])

  const handleLink = () => {
    if (!selectedId) return

    const newId = dispatch(
      trModel.linkTransactionsAsTransfer(sourceTransaction.id, selectedId)
    )
    onLinked(newId as unknown as TTransactionId)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('transfer.linkTitle')}</DialogTitle>
      <DialogContent>
        {candidates.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            {t('transfer.noMatches')}
          </Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('transfer.selectTransaction')}
            </Typography>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {candidates.map(tr => {
                const trType = getTrType(tr)
                const amount = trType === TrType.Income ? tr.income : tr.outcome
                const account =
                  trType === TrType.Income
                    ? accounts[tr.incomeAccount]
                    : accounts[tr.outcomeAccount]
                const inst =
                  trType === TrType.Income
                    ? instruments[tr.incomeInstrument]
                    : instruments[tr.outcomeInstrument]

                return (
                  <ListItemButton
                    key={tr.id}
                    selected={selectedId === tr.id}
                    onClick={() => setSelectedId(tr.id)}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemText
                      primary={
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <span>{tr.payee || account?.title || 'No payee'}</span>
                          <Typography
                            component="span"
                            sx={{
                              fontWeight: 500,
                              color:
                                trType === TrType.Income
                                  ? 'success.main'
                                  : 'error.main',
                            }}
                          >
                            {trType === TrType.Income ? '+' : '-'}
                            {formatMoney(amount, inst?.shortTitle)}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mt: 0.5 }}
                        >
                          <Typography variant="caption">
                            {formatDate(tr.date, 'dd MMM yyyy')}
                          </Typography>
                          <Chip
                            label={account?.title}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Stack>
                      }
                    />
                  </ListItemButton>
                )
              })}
            </List>

            {exchangeRateInfo && selectedTransaction && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {t('transfer.exchangeRate')}:
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {exchangeRateInfo}
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('transfer.cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleLink}
          disabled={!selectedId}
        >
          {t('transfer.link')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
