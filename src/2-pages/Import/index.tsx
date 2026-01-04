import React from 'react'
import { Box, Typography, Container } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useTranslation } from 'react-i18next'
import { ImportButton, ImportHistory } from '3-widgets/import'

export default function ImportPage() {
  const { t } = useTranslation('import')

  return (
    <>
      <Helmet>
        <title>{t('pageTitle')} | Zerro</title>
        <meta name="description" content={t('pageDescription')} />
        <link rel="canonical" href="https://zerro.app/import" />
      </Helmet>

      <Container maxWidth="sm" sx={{ py: 3, pb: 10 }}>
        <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
          {t('pageTitle')}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <ImportButton fullWidth />
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('historyTitle')}
        </Typography>

        <ImportHistory />
      </Container>
    </>
  )
}
