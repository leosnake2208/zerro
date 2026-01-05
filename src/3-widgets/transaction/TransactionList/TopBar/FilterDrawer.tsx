import React, { FC, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Drawer,
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormGroup,
  Chip,
  Stack,
  Divider,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Tooltip } from '6-shared/ui/Tooltip'
import {
  CloseIcon,
  ChevronDownIcon,
  CalendarIcon,
} from '6-shared/ui/Icons'
import { TagSelect } from '5-entities/tag/ui/TagSelect'
import { TrCondition, TrType } from '5-entities/transaction'
import { accountModel } from '5-entities/account'
import { instrumentModel } from '5-entities/currency/instrument'
import { AccountType, TAccountId, TInstrumentId } from '6-shared/types'
import { parseDate, toISODate } from '6-shared/helpers/date'

const drawerWidth = { xs: '100vw', sm: 400 }
const contentSx = {
  width: drawerWidth,
  [`& .MuiDrawer-paper`]: { width: drawerWidth },
}

type FilterDrawerProps = {
  setCondition: (c: TrCondition) => void
  conditions: TrCondition
  clearFilter: () => void
  onClose: () => void
  open: boolean
}

const FilterDrawer: FC<FilterDrawerProps> = ({
  conditions = {},
  setCondition,
  clearFilter,
  onClose,
  open,
  ...rest
}) => {
  const { t } = useTranslation('filterDrawer')
  const accounts = accountModel.usePopulatedAccounts()
  const instruments = instrumentModel.useInstruments()

  // Get unique currencies from accounts
  const currencies = useMemo(() => {
    const seen = new Set<TInstrumentId>()
    Object.values(accounts).forEach(acc => {
      if (!acc.archive) seen.add(acc.instrument)
    })
    return Array.from(seen)
      .map(id => instruments[id])
      .filter(Boolean)
      .sort((a, b) => a.shortTitle.localeCompare(b.shortTitle))
  }, [accounts, instruments])

  // Group accounts by type
  const accountsByType = useMemo(() => {
    const groups: Record<AccountType, typeof accounts[string][]> = {
      [AccountType.Cash]: [],
      [AccountType.Ccard]: [],
      [AccountType.Checking]: [],
      [AccountType.Loan]: [],
      [AccountType.Deposit]: [],
      [AccountType.Emoney]: [],
      [AccountType.Debt]: [],
    }
    Object.values(accounts)
      .filter(acc => !acc.archive)
      .sort((a, b) => a.title.localeCompare(b.title))
      .forEach(acc => {
        groups[acc.type].push(acc)
      })
    return groups
  }, [accounts])

  const allAccountIds = useMemo(
    () =>
      Object.values(accounts)
        .filter(acc => !acc.archive)
        .map(acc => acc.id),
    [accounts]
  )

  const { gte, lte } = getGteLte(conditions.amount)

  // Transaction types
  const allTypes: TrType[] = [
    TrType.Income,
    TrType.Outcome,
    TrType.Transfer,
    TrType.IncomeDebt,
    TrType.OutcomeDebt,
  ]

  // Handlers
  const handleTypeToggle = useCallback(
    (type: TrType) => {
      const current = conditions.types || []
      const newTypes = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type]
      setCondition({ types: newTypes.length > 0 ? newTypes : undefined })
    },
    [conditions.types, setCondition]
  )

  const handleSelectAllTypes = useCallback(() => {
    setCondition({ types: undefined })
  }, [setCondition])

  const handleAccountToggle = useCallback(
    (accountId: TAccountId) => {
      const current = conditions.accounts || []
      const newAccounts = current.includes(accountId)
        ? current.filter(id => id !== accountId)
        : [...current, accountId]
      setCondition({ accounts: newAccounts.length > 0 ? newAccounts : undefined })
    },
    [conditions.accounts, setCondition]
  )

  const handleSelectAllAccounts = useCallback(() => {
    setCondition({ accounts: undefined })
  }, [setCondition])

  const handleSelectAccountsByType = useCallback(
    (type: AccountType) => {
      const ids = accountsByType[type].map(acc => acc.id)
      setCondition({ accounts: ids.length > 0 ? ids : undefined })
    },
    [accountsByType, setCondition]
  )

  const handleCurrencyToggle = useCallback(
    (instrumentId: TInstrumentId) => {
      const current = conditions.currencies || []
      const newCurrencies = current.includes(instrumentId)
        ? current.filter(id => id !== instrumentId)
        : [...current, instrumentId]
      setCondition({
        currencies: newCurrencies.length > 0 ? newCurrencies : undefined,
      })
    },
    [conditions.currencies, setCondition]
  )

  const handleSelectAllCurrencies = useCallback(() => {
    setCondition({ currencies: undefined })
  }, [setCondition])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (conditions.search) count++
    if (conditions.amount) count++
    if (conditions.dateFrom || conditions.dateTo) count++
    if (conditions.types?.length) count++
    if (conditions.accounts?.length) count++
    if (conditions.currencies?.length) count++
    if (conditions.tags?.length) count++
    if (conditions.isViewed === false) count++
    if (conditions.showDeleted || conditions.onlyDeleted) count++
    return count
  }, [conditions])

  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={open}
      sx={contentSx}
      {...rest}
    >
      <Box sx={{ py: 1, px: 2, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" noWrap>
            {t('filter')}
          </Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              size="small"
              color="primary"
            />
          )}
        </Box>
        <Tooltip title={t('close')}>
          <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
        </Tooltip>
      </Box>

      <Box
        sx={{
          px: 2,
          pb: 2,
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Search */}
        <TextField
          label={t('searchComments')}
          value={conditions.search || ''}
          onChange={e => setCondition({ search: e.target.value || undefined })}
          variant="outlined"
          fullWidth
          size="small"
        />

        {/* Date Range */}
        <Accordion disableGutters defaultExpanded={Boolean(conditions.dateFrom || conditions.dateTo)}>
          <AccordionSummary expandIcon={<ChevronDownIcon />}>
            <Typography variant="subtitle2">{t('dateRange')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={2}>
              <DatePicker
                label={t('dateFrom')}
                value={conditions.dateFrom ? parseDate(conditions.dateFrom) : null}
                onChange={date =>
                  setCondition({ dateFrom: date ? toISODate(date) : undefined })
                }
                format="dd.MM.yyyy"
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                slots={{ openPickerIcon: CalendarIcon }}
              />
              <DatePicker
                label={t('dateTo')}
                value={conditions.dateTo ? parseDate(conditions.dateTo) : null}
                onChange={date =>
                  setCondition({ dateTo: date ? toISODate(date) : undefined })
                }
                format="dd.MM.yyyy"
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                slots={{ openPickerIcon: CalendarIcon }}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Amount Range */}
        <Accordion disableGutters defaultExpanded={Boolean(conditions.amount)}>
          <AccordionSummary expandIcon={<ChevronDownIcon />}>
            <Typography variant="subtitle2">{t('amountRange')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={2}>
              <TextField
                size="small"
                label={t('amountFrom')}
                value={gte ?? ''}
                type="number"
                onChange={e => {
                  const value = e.target.value ? +e.target.value : undefined
                  setCondition({ amount: { lte, gte: value } })
                }}
                fullWidth
              />
              <TextField
                size="small"
                label={t('amountTo')}
                value={lte ?? ''}
                type="number"
                onChange={e => {
                  const value = e.target.value ? +e.target.value : undefined
                  setCondition({ amount: { gte, lte: value } })
                }}
                fullWidth
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Transaction Types */}
        <Accordion disableGutters defaultExpanded={Boolean(conditions.types?.length)}>
          <AccordionSummary expandIcon={<ChevronDownIcon />}>
            <Typography variant="subtitle2">{t('transactionType')}</Typography>
            {conditions.types?.length ? (
              <Chip
                label={conditions.types.length}
                size="small"
                sx={{ ml: 1 }}
              />
            ) : null}
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 1 }}>
              <Button size="small" onClick={handleSelectAllTypes}>
                {t('selectAll')}
              </Button>
            </Box>
            <FormGroup>
              {allTypes.map(type => (
                <FormControlLabel
                  key={type}
                  control={
                    <Checkbox
                      size="small"
                      checked={
                        !conditions.types?.length ||
                        conditions.types.includes(type)
                      }
                      onChange={() => handleTypeToggle(type)}
                    />
                  }
                  label={t(`type_${type}`)}
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* Accounts */}
        <Accordion disableGutters defaultExpanded={Boolean(conditions.accounts?.length)}>
          <AccordionSummary expandIcon={<ChevronDownIcon />}>
            <Typography variant="subtitle2">{t('accounts')}</Typography>
            {conditions.accounts?.length ? (
              <Chip
                label={conditions.accounts.length}
                size="small"
                sx={{ ml: 1 }}
              />
            ) : null}
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button size="small" onClick={handleSelectAllAccounts}>
                  {t('selectAll')}
                </Button>
                <Button
                  size="small"
                  onClick={() => handleSelectAccountsByType(AccountType.Cash)}
                >
                  {t('accountType_cash')}
                </Button>
                <Button
                  size="small"
                  onClick={() => handleSelectAccountsByType(AccountType.Ccard)}
                >
                  {t('accountType_card')}
                </Button>
                <Button
                  size="small"
                  onClick={() => handleSelectAccountsByType(AccountType.Deposit)}
                >
                  {t('accountType_savings')}
                </Button>
              </Stack>
            </Stack>
            <FormGroup sx={{ maxHeight: 200, overflow: 'auto' }}>
              {Object.values(accounts)
                .filter(acc => !acc.archive)
                .sort((a, b) => a.title.localeCompare(b.title))
                .map(acc => (
                  <FormControlLabel
                    key={acc.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={
                          !conditions.accounts?.length ||
                          conditions.accounts.includes(acc.id)
                        }
                        onChange={() => handleAccountToggle(acc.id)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{acc.title}</span>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {acc.fxCode}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* Currencies */}
        <Accordion disableGutters defaultExpanded={Boolean(conditions.currencies?.length)}>
          <AccordionSummary expandIcon={<ChevronDownIcon />}>
            <Typography variant="subtitle2">{t('currencies')}</Typography>
            {conditions.currencies?.length ? (
              <Chip
                label={conditions.currencies.length}
                size="small"
                sx={{ ml: 1 }}
              />
            ) : null}
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 1 }}>
              <Button size="small" onClick={handleSelectAllCurrencies}>
                {t('selectAll')}
              </Button>
            </Box>
            <FormGroup>
              {currencies.map(inst => (
                <FormControlLabel
                  key={inst.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={
                        !conditions.currencies?.length ||
                        conditions.currencies.includes(inst.id)
                      }
                      onChange={() => handleCurrencyToggle(inst.id)}
                    />
                  }
                  label={`${inst.shortTitle} (${inst.symbol})`}
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* Categories */}
        <Accordion disableGutters defaultExpanded={Boolean(conditions.tags?.length)}>
          <AccordionSummary expandIcon={<ChevronDownIcon />}>
            <Typography variant="subtitle2">{t('categories')}</Typography>
            {conditions.tags?.length ? (
              <Chip
                label={conditions.tags.length}
                size="small"
                sx={{ ml: 1 }}
              />
            ) : null}
          </AccordionSummary>
          <AccordionDetails>
            <TagSelect
              multiple
              tagFilters={{ includeNull: true }}
              value={conditions.tags || []}
              onChange={tags =>
                setCondition({ tags: tags as TrCondition['tags'] })
              }
            />
          </AccordionDetails>
        </Accordion>

        <Divider />

        {/* Toggles */}
        <Box>
          <FormControlLabel
            label={t('onlyNew')}
            control={
              <Switch
                color="primary"
                checked={conditions.isViewed === false}
                onChange={e => {
                  setCondition({ isViewed: e.target.checked ? false : undefined })
                }}
              />
            }
          />
        </Box>

        <Box>
          <FormControlLabel
            label={t('showDeleted')}
            control={
              <Switch
                checked={Boolean(conditions.showDeleted) && !conditions.onlyDeleted}
                onChange={e => {
                  setCondition({
                    showDeleted: e.target.checked || undefined,
                    onlyDeleted: undefined,
                  })
                }}
                color="primary"
              />
            }
          />
        </Box>

        <Box>
          <FormControlLabel
            label={t('onlyDeleted')}
            control={
              <Switch
                checked={Boolean(conditions.onlyDeleted)}
                onChange={e => {
                  setCondition({
                    onlyDeleted: e.target.checked || undefined,
                    showDeleted: e.target.checked || conditions.showDeleted,
                  })
                }}
                color="warning"
              />
            }
          />
        </Box>

        {/* Clear Filter Button */}
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Button
            onClick={clearFilter}
            variant="contained"
            fullWidth
            color="primary"
          >
            {t('clearFilter')}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default FilterDrawer

function getGteLte(amount: TrCondition['amount']) {
  if (amount === undefined || amount === null)
    return { gte: undefined, lte: undefined }
  if (typeof amount === 'number') return { gte: amount, lte: amount }
  if (typeof amount === 'object')
    return {
      gte: amount.gte === undefined ? undefined : +amount.gte,
      lte: amount.lte === undefined ? undefined : +amount.lte,
    }
  return { gte: undefined, lte: undefined }
}
