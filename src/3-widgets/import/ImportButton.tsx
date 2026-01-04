import React, { FC } from 'react'
import { Button } from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { useTranslation } from 'react-i18next'
import { useImportDialog } from './ImportDialog'
import type { TAccountId } from '6-shared/types'

type ImportButtonProps = {
  /** Pre-select account when opening dialog */
  accountId?: TAccountId
  /** Button variant */
  variant?: 'text' | 'outlined' | 'contained'
  /** Full width button */
  fullWidth?: boolean
}

export const ImportButton: FC<ImportButtonProps> = ({
  accountId,
  variant = 'contained',
  fullWidth = false,
}) => {
  const { t } = useTranslation('import')
  const openImportDialog = useImportDialog()

  const handleClick = () => {
    openImportDialog({ preselectedAccountId: accountId })
  }

  return (
    <Button
      variant={variant}
      startIcon={<UploadFileIcon />}
      onClick={handleClick}
      fullWidth={fullWidth}
    >
      {t('importButton')}
    </Button>
  )
}
