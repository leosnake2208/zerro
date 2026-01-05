import type {
  TTransaction,
  TTransactionId,
  TAccountId,
} from '6-shared/types'

import React, { useState, useEffect, FC, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Fab,
  Zoom,
  Button,
  Stack,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Tooltip } from '6-shared/ui/Tooltip'
import {
  DeleteIcon,
  CloseIcon,
  RestoreFromTrashIcon,
  CalendarIcon,
  EditIcon,
} from '6-shared/ui/Icons'
import { AmountInput } from '6-shared/ui/AmountInput'
import { rateToWords } from '6-shared/helpers/money'
import { formatDate, parseDate, toISODate } from '6-shared/helpers/date'

import { useAppDispatch } from 'store'

import { trModel, TrType } from '5-entities/transaction'
import { accountModel } from '5-entities/account'
import { instrumentModel } from '5-entities/currency/instrument'
import { TagList } from '5-entities/tag/ui/TagList'

import { Reciept } from './Reciept'
import { Map } from './Map'
import { AdvancedDetails } from './AdvancedDetails'
import { TransactionTypeSwitch } from './TransactionTypeSwitch'
import { AccountSelector } from './AccountSelector'

/**
 * Empty state for transaction preview
 */
export const TrEmptyState = () => {
  const { t } = useTranslation('transaction')
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'text.disabled',
        p: 3,
      }}
    >
      <Typography variant="body2" align="center" color="inherit">
        {t('fullEmptyState')}
      </Typography>
    </Box>
  )
}

export type TransactionPreviewProps = {
  id: string
  onClose: () => void
  onOpenOther: (id: TTransactionId) => void
  onSelectSimilar?: (date: number) => void
}

export const TransactionPreview: FC<TransactionPreviewProps> = props => {
  const transaction = trModel.useTransaction(props.id)
  return transaction ? <TransactionContent {...props} /> : <TrEmptyState />
}

const TransactionContent: FC<TransactionPreviewProps> = props => {
  const { id, onClose, onOpenOther, onSelectSimilar } = props
  const { t } = useTranslation('transaction')
  const dispatch = useAppDispatch()
  const onDelete = () => dispatch(trModel.deleteTransactions([id]))
  const onDeletePermanently = () =>
    dispatch(trModel.deleteTransactionsPermanently([id]))
  const onRestore = () => dispatch(trModel.restoreTransaction(id))
  // onSplit: id => dispatch(splitTransfer(id)), // does not work

  const { t: te } = useTranslation('transactionEditor')
  const tr = trModel.useTransaction(id)!
  const getTrType = trModel.useTrTypeGetter()
  const trType = getTrType(tr)
  const accounts = accountModel.usePopulatedAccounts()
  const incomeAccount = accounts[tr.incomeAccount]
  const outcomeAccount = accounts[tr.outcomeAccount]
  const instruments = instrumentModel.useInstruments()
  const incomeCurrency = instruments[tr.incomeInstrument]?.shortTitle
  const outcomeCurrency = instruments[tr.outcomeInstrument]?.shortTitle

  const {
    date,
    changed,
    created,
    deleted,
    qrCode,
    income,
    outcome,
    tag,
    comment,
    payee,
    originalPayee,
    latitude,
    longitude,
  } = tr

  const [localComment, setLocalComment] = useState(tr.comment)
  const [localOutcome, setLocalOutcome] = useState(tr.outcome)
  const [localIncome, setLocalIncome] = useState(tr.income)
  const [localPayee, setLocalPayee] = useState(tr.payee)
  const [localOriginalPayee, setLocalOriginalPayee] = useState(
    tr.originalPayee
  )
  const [localDate, setLocalDate] = useState(tr.date)
  const [localTime, setLocalTime] = useState(formatDate(tr.created, 'HH:mm'))
  const [localTag, setLocalTag] = useState(tr.tag)
  const [localType, setLocalType] = useState<TrType>(trType)
  const [localIncomeAccount, setLocalIncomeAccount] = useState<TAccountId>(
    tr.incomeAccount
  )
  const [localOutcomeAccount, setLocalOutcomeAccount] = useState<TAccountId>(
    tr.outcomeAccount
  )
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    setLocalComment(tr.comment)
    setLocalOutcome(tr.outcome)
    setLocalIncome(tr.income)
    setLocalPayee(tr.payee)
    setLocalOriginalPayee(tr.originalPayee)
    setLocalDate(tr.date)
    setLocalTime(formatDate(tr.created, 'HH:mm'))
    setLocalTag(tr.tag)
    setLocalType(getTrType(tr))
    setLocalIncomeAccount(tr.incomeAccount)
    setLocalOutcomeAccount(tr.outcomeAccount)
  }, [tr, getTrType])

  // Get local account info based on selected accounts
  const localIncomeAccountObj = accounts[localIncomeAccount]
  const localOutcomeAccountObj = accounts[localOutcomeAccount]
  const localIncomeCurrency =
    localIncomeAccountObj &&
    instruments[localIncomeAccountObj.instrument]?.shortTitle
  const localOutcomeCurrency =
    localOutcomeAccountObj &&
    instruments[localOutcomeAccountObj.instrument]?.shortTitle

  const timeChanged = formatDate(tr.created, 'HH:mm') !== localTime

  const typeChanged = trType !== localType
  const accountsChanged =
    tr.incomeAccount !== localIncomeAccount ||
    tr.outcomeAccount !== localOutcomeAccount

  const hasChanges =
    comment !== localComment ||
    outcome !== localOutcome ||
    income !== localIncome ||
    payee !== localPayee ||
    originalPayee !== localOriginalPayee ||
    date !== localDate ||
    localTag !== tag ||
    timeChanged ||
    typeChanged ||
    accountsChanged

  const onSave = () => {
    // Prepare the base changes
    const changes = {
      comment: localComment,
      outcome: localOutcome,
      income: localIncome,
      payee: localPayee,
      originalPayee: localOriginalPayee,
      date: localDate,
      tag: localTag,
      incomeAccount: localIncomeAccount,
      outcomeAccount: localOutcomeAccount,
    }

    if (timeChanged || typeChanged || accountsChanged) {
      // Need to recreate the transaction for time/type/account changes
      const hh = +localTime.split(':')[0]
      const mm = +localTime.split(':')[1]
      let createdDate = parseDate(tr.date)
      createdDate.setHours(hh)
      createdDate.setMinutes(mm)
      let newId = dispatch(
        trModel.recreateTransaction({
          id,
          created: +createdDate,
          ...changes,
        })
      ) as unknown
      onOpenOther(newId as string)
    } else if (hasChanges) {
      dispatch(
        trModel.applyChangesToTransaction({
          id,
          ...changes,
        })
      )
    }
    setIsEditMode(false)
  }

  const onCancelEdit = useCallback(() => {
    // Reset local state to original values
    setLocalComment(tr.comment)
    setLocalOutcome(tr.outcome)
    setLocalIncome(tr.income)
    setLocalPayee(tr.payee)
    setLocalOriginalPayee(tr.originalPayee)
    setLocalDate(tr.date)
    setLocalTime(formatDate(tr.created, 'HH:mm'))
    setLocalTag(tr.tag)
    setLocalType(getTrType(tr))
    setLocalIncomeAccount(tr.incomeAccount)
    setLocalOutcomeAccount(tr.outcomeAccount)
    setIsEditMode(false)
  }, [tr, getTrType])

  const titles = {
    income: t('type_income'),
    outcome: t('type_outcome'),
    transfer: t('type_transfer'),
    incomeDebt: t('type_debt'),
    outcomeDebt: t('type_debt'),
  }

  return (
    <Box
      sx={{
        minWidth: 320,
        position: 'relative',
      }}
    >
      <Head
        title={titles[trType]}
        onClose={onClose}
        onDelete={onDelete}
        onDeletePermanently={onDeletePermanently}
        onRestore={onRestore}
        deleted={deleted}
        isEditMode={isEditMode}
        onEdit={() => setIsEditMode(true)}
      />
      {/* Type Switcher - only in edit mode */}
      {isEditMode && (
        <Box sx={{ px: 3, pt: 2 }}>
          <TransactionTypeSwitch
            value={localType}
            onChange={setLocalType}
            disabled={deleted}
          />
        </Box>
      )}

      {/* Tags (only for income/outcome) */}
      {(localType === TrType.Income || localType === TrType.Outcome) &&
        (isEditMode ? (
          <TagList
            tags={localTag}
            onChange={setLocalTag}
            tagType={localType === TrType.Income ? 'income' : 'outcome'}
            px={3}
            py={2}
            bgcolor="background.default"
          />
        ) : (
          tag &&
          tag.length > 0 && (
            <TagList
              tags={tag}
              onChange={() => {}}
              tagType={trType === TrType.Income ? 'income' : 'outcome'}
              px={3}
              py={2}
              bgcolor="background.default"
              sx={{ pointerEvents: 'none' }}
            />
          )
        ))}

      <Stack
        spacing={isEditMode ? 4 : 2}
        sx={{
          p: 3,
        }}
      >
        {isEditMode ? (
          /* Edit Mode */
          <>
            {/* Outcome amount and account */}
            {localType !== TrType.Income && (
              <>
                <AccountSelector
                  value={localOutcomeAccount}
                  onChange={setLocalOutcomeAccount}
                  excludeAccount={localIncomeAccount}
                  label={te('accountSelect.outcomeAccount')}
                />
                <AmountInput
                  label={t('otcomeFrom', {
                    account: localOutcomeAccountObj?.title || '',
                  })}
                  currency={localOutcomeCurrency}
                  value={localOutcome}
                  onChange={setLocalOutcome}
                  selectOnFocus
                  fullWidth
                  size="small"
                />
              </>
            )}

            {/* Income amount and account */}
            {localType !== TrType.Outcome && (
              <>
                <AccountSelector
                  value={localIncomeAccount}
                  onChange={setLocalIncomeAccount}
                  excludeAccount={localOutcomeAccount}
                  label={te('accountSelect.incomeAccount')}
                />
                <AmountInput
                  label={t('incomeTo', {
                    account: localIncomeAccountObj?.title || '',
                  })}
                  currency={localIncomeCurrency}
                  value={localIncome}
                  onChange={setLocalIncome}
                  selectOnFocus
                  fullWidth
                  size="small"
                />
              </>
            )}
            <Stack direction="row" spacing={2}>
              <DatePicker
                label={t('date')}
                value={parseDate(localDate)}
                onChange={date => date && setLocalDate(toISODate(date))}
                showDaysOutsideCurrentMonth
                format="dd.MM.yyyy"
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                slots={{ openPickerIcon: CalendarIcon }}
              />
              <TextField
                label={t('time')}
                value={localTime}
                onChange={e => setLocalTime(e.target.value)}
                type="time"
                size="small"
                sx={{ minWidth: 104 }}
                slotProps={{
                  htmlInput: {
                    sx: {
                      appearance: 'none',
                      '::-webkit-calendar-picker-indicator': { display: 'none' },
                    },
                  },
                }}
              />
            </Stack>
            <TextField
              label={t('payee')}
              value={localPayee || ''}
              onChange={e => setLocalPayee(e.target.value)}
              multiline
              maxRows="4"
              fullWidth
              helperText=""
              size="small"
            />
            <TextField
              label={t('comment')}
              value={localComment || ''}
              onChange={e => setLocalComment(e.target.value)}
              multiline
              maxRows="4"
              fullWidth
              helperText=""
              size="small"
            />
            <TextField
              label={t('originalPayee')}
              value={localOriginalPayee || ''}
              onChange={e => setLocalOriginalPayee(e.target.value)}
              fullWidth
              helperText={t('originalPayeeHint')}
              size="small"
            />
          </>
        ) : (
          /* View Mode */
          <>
            {/* Amount display */}
            {trType !== TrType.Income && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('otcomeFrom', { account: outcomeAccount?.title || '' })}
                </Typography>
                <Typography variant="h5" color="error.main">
                  −{outcome.toLocaleString()} {outcomeCurrency}
                </Typography>
              </Box>
            )}
            {trType !== TrType.Outcome && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('incomeTo', { account: incomeAccount?.title || '' })}
                </Typography>
                <Typography variant="h5" color="success.main">
                  +{income.toLocaleString()} {incomeCurrency}
                </Typography>
              </Box>
            )}

            {/* Date */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('date')}
              </Typography>
              <Typography>
                {formatDate(parseDate(date), 'dd MMMM yyyy')},{' '}
                {formatDate(created, 'HH:mm')}
              </Typography>
            </Box>

            {/* Payee */}
            {payee && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('payee')}
                </Typography>
                <Typography>{payee}</Typography>
              </Box>
            )}

            {/* Comment */}
            {comment && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('comment')}
                </Typography>
                <Typography>{comment}</Typography>
              </Box>
            )}

            {/* Original Payee */}
            {originalPayee && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('originalPayee')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {originalPayee}
                </Typography>
              </Box>
            )}
          </>
        )}

        <Reciept value={qrCode} />
        <Map longitude={longitude} latitude={latitude} />
        <AdvancedDetails transaction={tr} />

        <Stack
          spacing={1}
          sx={{ typography: 'caption', color: 'text.secondary' }}
        >
          <span>
            {t('created', {
              date: formatDate(created, 'dd MMM yyyy, HH:mm'),
            })}
          </span>
          <span>
            {t('changed', {
              date: formatDate(changed, 'dd MMM yyyy, HH:mm'),
            })}
          </span>
          <RateToWords tr={tr} />
        </Stack>

        {!!onSelectSimilar && (
          <Button onClick={() => onSelectSimilar(changed)}>
            {t('btnOtherFromSync')}
          </Button>
        )}
      </Stack>
      <SaveButton
        visible={isEditMode}
        hasChanges={hasChanges}
        onSave={onSave}
        onCancel={onCancelEdit}
      />
    </Box>
  )
}

const Head: FC<{
  title: string
  deleted: boolean
  isEditMode: boolean
  onClose: () => void
  onDelete: () => void
  onDeletePermanently: () => void
  onRestore: () => void
  onEdit: () => void
}> = props => {
  const {
    title,
    deleted,
    isEditMode,
    onClose,
    onDelete,
    onDeletePermanently,
    onRestore,
    onEdit,
  } = props
  const { t } = useTranslation('transaction')
  return (
    <Box
      sx={{
        py: 1,
        px: 3,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
        }}
      >
        {deleted && (
          <Typography variant="caption" color="error" noWrap>
            {t('transactionDeleted')}
          </Typography>
        )}
        <Typography variant="h6" noWrap>
          {title}
        </Typography>
      </Box>
      {!deleted && !isEditMode && (
        <Tooltip title={t('btnEdit')}>
          <IconButton onClick={onEdit} children={<EditIcon />} />
        </Tooltip>
      )}
      {deleted ? (
        <Tooltip title={t('btnRestore')}>
          <IconButton onClick={onRestore} children={<RestoreFromTrashIcon />} />
        </Tooltip>
      ) : (
        <Tooltip title={t('btnDelete')}>
          <IconButton
            onClick={e => (e.shiftKey ? onDeletePermanently() : onDelete())}
            children={<DeleteIcon />}
          />
        </Tooltip>
      )}
      <Tooltip title={t('btnClose')}>
        <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
      </Tooltip>
    </Box>
  )
}

const SaveButton: FC<{
  visible: boolean
  hasChanges: boolean
  onSave: () => void
  onCancel: () => void
}> = props => {
  const { visible, hasChanges, onSave, onCancel } = props
  const { t } = useTranslation('transaction')
  return (
    <Zoom in={visible}>
      <Stack
        direction="row"
        spacing={1}
        justifyContent="center"
        sx={{
          mt: 2,
          pb: 2,
          position: 'sticky',
          bottom: 16,
          zIndex: 200,
        }}
      >
        <Button variant="outlined" onClick={onCancel}>
          {t('btnCancel')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onSave}
          disabled={!hasChanges}
        >
          {t('btnSave')}
        </Button>
      </Stack>
    </Zoom>
  )
}

const RateToWords: FC<{ tr: TTransaction }> = ({ tr }) => {
  const { t } = useTranslation('transaction')
  const trType = trModel.getType(tr)
  const { income, opIncome, outcome, opOutcome } = tr
  const instruments = instrumentModel.useInstruments()
  const incomeCurrency = instruments[tr.incomeInstrument]?.shortTitle
  const opIncomeCurrency =
    tr.opIncomeInstrument && instruments[tr.opIncomeInstrument]?.shortTitle
  const outcomeCurrency = instruments[tr.outcomeInstrument]?.shortTitle
  const opOutcomeCurrency =
    tr.opOutcomeInstrument && instruments[tr.opOutcomeInstrument]?.shortTitle

  let rate = ''

  if (trType === 'income' && opIncome && opIncomeCurrency) {
    rate = rateToWords(income, incomeCurrency, opIncome, opIncomeCurrency)
  }
  if (trType === 'outcome' && opOutcome && opOutcomeCurrency) {
    rate = rateToWords(outcome, outcomeCurrency, opOutcome, opOutcomeCurrency)
  }
  if (trType === 'transfer' && incomeCurrency !== outcomeCurrency) {
    rate = rateToWords(outcome, outcomeCurrency, income, incomeCurrency)
  }

  if (rate) {
    return <span>{t('rate', { rate })}</span>
  }
  return null
}
