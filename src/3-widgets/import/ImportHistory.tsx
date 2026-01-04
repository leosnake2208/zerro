import React, { FC } from 'react'
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Paper,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { importModel, TImportRecord } from '5-entities/import'
import { accountModel } from '5-entities/account'
import type { TAccountId } from '6-shared/types'

type ImportHistoryProps = {
  /** Filter by account ID (optional) */
  accountId?: TAccountId
}

export const ImportHistory: FC<ImportHistoryProps> = ({ accountId }) => {
  const { t } = useTranslation('import')
  const allImports = importModel.useImports()
  const accounts = accountModel.useAccounts()

  // Filter by account if specified
  const imports = accountId
    ? allImports.filter(i => i.accountId === accountId)
    : allImports

  const handleDelete = (record: TImportRecord) => {
    if (window.confirm(t('confirmDeleteImport'))) {
      importModel.removeImportRecord(record.id)
    }
  }

  if (imports.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">{t('noImports')}</Typography>
      </Box>
    )
  }

  return (
    <Paper variant="outlined">
      <List disablePadding>
        {imports.map((imp, index) => {
          const account = accounts[imp.accountId]
          const importDate = format(imp.importDate, 'dd MMM yyyy, HH:mm', {
            locale: ru,
          })

          return (
            <ListItem
              key={imp.id}
              divider={index < imports.length - 1}
              sx={{ py: 1.5 }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">
                      {account?.title || t('unknownAccount')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({imp.bankCode})
                    </Typography>
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" component="span">
                      {importDate}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ mx: 1 }}
                    >
                      •
                    </Typography>
                    <Typography variant="body2" component="span">
                      {t('transactionsCount', { count: imp.transactionCount })}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{ mx: 1 }}
                    >
                      •
                    </Typography>
                    <Typography variant="body2" component="span">
                      {imp.dateRangeStart} — {imp.dateRangeEnd}
                    </Typography>
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => handleDelete(imp)}
                  title={t('deleteImport')}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          )
        })}
      </List>
    </Paper>
  )
}
