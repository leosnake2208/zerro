import React, { FC, useState, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { useTranslation } from 'react-i18next'
import { registerPopover } from '6-shared/historyPopovers'
import { useAppDispatch } from 'store'
import { accountModel } from '5-entities/account'
import {
  importStatement,
  previewImport,
  suggestAccount,
  TParseResult,
} from '4-features/bankImport'
import type { TAccountId } from '6-shared/types'

type ImportDialogProps = {
  preselectedAccountId?: TAccountId
}

const importDialogHooks = registerPopover<ImportDialogProps>(
  'importDialog',
  { preselectedAccountId: undefined }
)

export const useImportDialog = () => {
  const { open } = importDialogHooks.useMethods()
  return useCallback(
    (props?: ImportDialogProps) => open(props || {}),
    [open]
  )
}

type Step = 'upload' | 'preview' | 'result'

export const ImportDialog: FC = () => {
  const { t } = useTranslation('import')
  const { displayProps, extraProps } = importDialogHooks.useProps()
  const dispatch = useAppDispatch()
  const accounts = accountModel.useAccountList()
  const accountsById = accountModel.useAccounts()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<TParseResult | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    extraProps.preselectedAccountId || ''
  )
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    imported: number
    skipped: number
  } | null>(null)

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile)
      setError(null)

      try {
        const content = await selectedFile.text()
        const parsed = previewImport(content, selectedFile.name)

        if (!parsed) {
          setError(t('unsupportedFormat'))
          return
        }

        setParseResult(parsed)

        // Try to auto-match account
        const suggested = suggestAccount(accountsById, parsed)
        if (suggested) {
          setSelectedAccountId(suggested.id)
        } else if (extraProps.preselectedAccountId) {
          setSelectedAccountId(extraProps.preselectedAccountId)
        }

        setStep('preview')
      } catch (e) {
        setError(t('parseError'))
      }
    },
    [accountsById, extraProps.preselectedAccountId, t]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        handleFileSelect(selectedFile)
      }
    },
    [handleFileSelect]
  )

  const handleImport = async () => {
    if (!file || !parseResult || !selectedAccountId) return

    setImporting(true)
    setError(null)

    try {
      const content = await file.text()
      const importResult = dispatch(
        importStatement(content, file.name, {
          accountId: selectedAccountId,
          skipDuplicates: true,
        })
      )

      setResult({ imported: importResult.imported, skipped: importResult.skipped })
      setStep('result')
    } catch (e: any) {
      setError(e.message || t('importError'))
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    displayProps.onClose()
    // Reset state after animation
    setTimeout(() => {
      setStep('upload')
      setFile(null)
      setParseResult(null)
      setSelectedAccountId(extraProps.preselectedAccountId || '')
      setError(null)
      setResult(null)
    }, 300)
  }

  const activeAccounts = accounts.filter(a => !a.archive)

  return (
    <Dialog
      open={displayProps.open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{t('dialogTitle')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {step === 'upload' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xml"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            <Box
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
            >
              <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography>{t('dropzoneText')}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('supportedFormats')}
              </Typography>
            </Box>
          </>
        )}

        {step === 'preview' && parseResult && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              {t('previewTitle')}
            </Typography>

            <List dense>
              <ListItem>
                <ListItemText
                  primary={t('bankDetected')}
                  secondary={parseResult.bankCode}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary={t('transactionCount')}
                  secondary={parseResult.transactions.length}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary={t('dateRange')}
                  secondary={`${parseResult.dateStart} — ${parseResult.dateEnd}`}
                />
              </ListItem>
              {parseResult.accountNumber && (
                <ListItem>
                  <ListItemText
                    primary={t('accountNumber')}
                    secondary={parseResult.accountNumber}
                  />
                </ListItem>
              )}
            </List>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>{t('selectAccount')}</InputLabel>
              <Select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                label={t('selectAccount')}
              >
                {activeAccounts.map(acc => (
                  <MenuItem key={acc.id} value={acc.id}>
                    {acc.title}
                    {acc.swiftCode && ` (${acc.swiftCode})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {importing && <LinearProgress sx={{ mt: 2 }} />}
          </Box>
        )}

        {step === 'result' && result && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              {t('importSuccess', { count: result.imported })}
            </Alert>
            {result.skipped > 0 && (
              <Typography variant="body2" color="text.secondary">
                {t('skippedDuplicates', { count: result.skipped })}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {step === 'result' ? t('done') : t('cancel')}
        </Button>
        {step === 'preview' && (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!selectedAccountId || importing}
          >
            {t('import')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
