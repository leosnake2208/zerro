import React, { FC, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Drawer,
  Box,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { CloseIcon } from '6-shared/ui/Icons'
import { Tooltip } from '6-shared/ui/Tooltip'
import { registerPopover } from '6-shared/historyPopovers'
import type { TAccountId } from '6-shared/types'
import { accountModel } from '5-entities/account'
import { AccountHeader } from './AccountHeader'
import { AccountSettings } from './AccountSettings'
import { AccountTransactions } from './AccountTransactions'
import { ImportHistoryTab } from './ImportHistoryTab'

export type AccountSettingsDrawerProps = {
  accountId: TAccountId
  initialTab?: 'settings' | 'transactions' | 'imports'
}

const drawerHooks = registerPopover<AccountSettingsDrawerProps>(
  'account-settings-drawer',
  { accountId: '' as TAccountId }
)

export const useAccountSettingsDrawer = () => {
  const { open } = drawerHooks.useMethods()
  return useCallback(
    (accountId: TAccountId, initialTab?: 'settings' | 'transactions' | 'imports') =>
      open({ accountId, initialTab }),
    [open]
  )
}

type TabValue = 'settings' | 'transactions' | 'imports'

const width = { xs: '100vw', sm: 480, md: 560 }
const contentSx = { width, [`& .MuiDrawer-paper`]: { width } }

export const AccountSettingsDrawer: FC = () => {
  const { t } = useTranslation('accountSettings')
  const drawer = drawerHooks.useProps()
  const { accountId, initialTab } = drawer.extraProps
  const { onClose, open } = drawer.displayProps
  const [tab, setTab] = useState<TabValue>(initialTab || 'settings')

  const account = accountModel.usePopulatedAccount(accountId)

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setTab(newValue)
  }

  if (!account) {
    return null
  }

  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={open}
      sx={contentSx}
      keepMounted={false}
    >
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 320,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            py: 1,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>
            {t('title')}
          </Typography>
          <Tooltip title={t('close', { ns: 'common' })}>
            <IconButton edge="end" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Account Header */}
        <AccountHeader account={account} />

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab label={t('tabs.settings')} value="settings" />
            <Tab label={t('tabs.transactions')} value="transactions" />
            <Tab label={t('tabs.imports')} value="imports" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ flex: '1 1 auto', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {tab === 'settings' && (
            <AccountSettings account={account} onClose={onClose} />
          )}
          {tab === 'transactions' && (
            <AccountTransactions accountId={accountId} />
          )}
          {tab === 'imports' && (
            <ImportHistoryTab accountId={accountId} />
          )}
        </Box>
      </Box>
    </Drawer>
  )
}
