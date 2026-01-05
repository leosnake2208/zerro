import React, { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  IconButton,
  Stack,
} from '@mui/material'
import { ChevronDownIcon } from '6-shared/ui/Icons'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { formatMoney } from '6-shared/helpers/money'
import type { TTransaction } from '6-shared/types'
import { useAppSelector, RootState } from 'store'
import { instrumentModel } from '5-entities/currency/instrument'
import { merchantModel } from '5-entities/merchant'

const getCompanies = (state: RootState) => state.data.current.company

type AdvancedDetailsProps = {
  transaction: TTransaction
}

export const AdvancedDetails: FC<AdvancedDetailsProps> = ({ transaction }) => {
  const { t } = useTranslation('transactionEditor')
  const [copied, setCopied] = useState(false)

  const instruments = instrumentModel.useInstruments()
  const merchants = merchantModel.useMerchants()
  const companies = useAppSelector(getCompanies)

  const {
    id,
    merchant,
    mcc,
    hold,
    viewed,
    incomeBankID,
    outcomeBankID,
    opIncome,
    opOutcome,
    opIncomeInstrument,
    opOutcomeInstrument,
    reminderMarker,
    originalPayee,
  } = transaction

  const merchantName = merchant && merchants[merchant]?.title
  const incomeBankName = incomeBankID && companies[incomeBankID]?.title
  const outcomeBankName = outcomeBankID && companies[outcomeBankID]?.title
  const opIncomeCurrency = opIncomeInstrument && instruments[opIncomeInstrument]?.shortTitle
  const opOutcomeCurrency = opOutcomeInstrument && instruments[opOutcomeInstrument]?.shortTitle

  const handleCopyId = () => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Check if there's anything to show
  const hasContent =
    merchantName ||
    mcc ||
    hold !== null ||
    incomeBankName ||
    outcomeBankName ||
    opIncome ||
    opOutcome ||
    originalPayee ||
    reminderMarker

  return (
    <Accordion
      disableGutters
      sx={{
        bgcolor: 'transparent',
        boxShadow: 'none',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={<ChevronDownIcon />}
        sx={{ px: 0, minHeight: 'auto' }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          {t('advanced.title')}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0, pt: 0 }}>
        <Stack spacing={1.5} sx={{ typography: 'body2' }}>
          {/* Transaction ID */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
              ID:
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 180,
              }}
            >
              {id}
            </Typography>
            <IconButton size="small" onClick={handleCopyId}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            {copied && (
              <Typography variant="caption" color="success.main">
                {t('advanced.copied')}
              </Typography>
            )}
          </Box>

          {/* Original Payee - shown here as read-only reference */}
          {originalPayee && (
            <DetailRow
              label={t('advanced.originalPayee')}
              value={originalPayee}
            />
          )}

          {/* Merchant */}
          {merchantName && (
            <DetailRow
              label={t('advanced.merchant')}
              value={merchantName}
            />
          )}

          {/* MCC */}
          {mcc && (
            <DetailRow
              label={t('advanced.mcc')}
              value={`${mcc}`}
            />
          )}

          {/* Hold Status */}
          {hold !== null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                {t('advanced.status')}:
              </Typography>
              <Chip
                label={hold ? t('advanced.pending') : t('advanced.cleared')}
                size="small"
                color={hold ? 'warning' : 'success'}
                variant="outlined"
              />
            </Box>
          )}

          {/* Viewed Status */}
          {viewed !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                {t('advanced.viewed')}:
              </Typography>
              <Chip
                label={viewed ? t('advanced.yes') : t('advanced.no')}
                size="small"
                variant="outlined"
              />
            </Box>
          )}

          {/* Income Bank */}
          {incomeBankName && (
            <DetailRow
              label={t('advanced.incomeBank')}
              value={incomeBankName}
            />
          )}

          {/* Outcome Bank */}
          {outcomeBankName && (
            <DetailRow
              label={t('advanced.outcomeBank')}
              value={outcomeBankName}
            />
          )}

          {/* Original Income Amount */}
          {opIncome && opIncomeCurrency && (
            <DetailRow
              label={t('advanced.originalIncome')}
              value={formatMoney(opIncome, opIncomeCurrency)}
            />
          )}

          {/* Original Outcome Amount */}
          {opOutcome && opOutcomeCurrency && (
            <DetailRow
              label={t('advanced.originalOutcome')}
              value={formatMoney(opOutcome, opOutcomeCurrency)}
            />
          )}

          {/* Reminder Marker */}
          {reminderMarker && (
            <DetailRow
              label={t('advanced.reminder')}
              value={reminderMarker}
            />
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}

const DetailRow: FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
      {label}:
    </Typography>
    <Typography variant="body2">{value}</Typography>
  </Box>
)
