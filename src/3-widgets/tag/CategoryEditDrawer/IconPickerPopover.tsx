import React, { FC, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Divider,
  Popover,
  PopoverProps,
  Stack,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import tagIcons from '6-shared/tagIcons.json'
import { registerPopover } from '6-shared/historyPopovers'

type TIconName = keyof typeof tagIcons

export type IconPickerProps = {
  value?: string | null
  onIconChange?: (value: string | null) => void
}

const iconPicker = registerPopover<IconPickerProps, PopoverProps>(
  'iconPicker',
  {}
)

export const useIconPicker = (
  value: IconPickerProps['value'],
  onIconChange: IconPickerProps['onIconChange']
) => {
  const { open } = iconPicker.useMethods()
  return useCallback(
    (e: React.MouseEvent) => {
      open({ value, onIconChange }, { anchorEl: e.currentTarget })
    },
    [onIconChange, open, value]
  )
}

// Group icons by category (first digit of code)
const iconCategories: Record<string, { label: string; icons: TIconName[] }> = {
  '1': { label: '🍽 Food & Drinks', icons: [] },
  '2': { label: '🎉 Entertainment', icons: [] },
  '3': { label: '🚗 Transport', icons: [] },
  '4': { label: '✈️ Travel', icons: [] },
  '5': { label: '🏠 Home & Shopping', icons: [] },
  '6': { label: '👨‍👩‍👧 Family & Health', icons: [] },
  '7': { label: '🌳 Nature & Pets', icons: [] },
  '8': { label: '❓ Other', icons: [] },
  '9': { label: '💰 Finance', icons: [] },
}

// Populate categories
Object.keys(tagIcons).forEach(key => {
  const category = key[0]
  if (iconCategories[category]) {
    iconCategories[category].icons.push(key as TIconName)
  }
})

const allIcons = Object.keys(tagIcons) as TIconName[]

// Icon descriptions for search (icon name to searchable text)
const getIconSearchText = (iconName: string): string => {
  // Extract readable name from icon key like "1001_bunch_ingredients"
  const parts = iconName.split('_')
  return parts.slice(1).join(' ').toLowerCase()
}

export const IconPicker: FC = () => {
  const { t } = useTranslation('categoryEditor')
  const popover = iconPicker.useProps()
  const { value, onIconChange } = popover.extraProps
  const [search, setSearch] = useState('')
  const [customEmoji, setCustomEmoji] = useState('')

  const handleIconClick = (iconName: string | null) => {
    onIconChange?.(iconName)
    popover.close()
  }

  const handleCustomEmojiSubmit = () => {
    if (customEmoji.trim()) {
      // Store custom emoji as the emoji character itself (not an icon name)
      onIconChange?.(customEmoji.trim())
      popover.close()
    }
  }

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return null // Show all categories
    const searchLower = search.toLowerCase()
    return allIcons.filter(iconName => {
      const searchText = getIconSearchText(iconName)
      const emoji = tagIcons[iconName]
      return (
        searchText.includes(searchLower) ||
        iconName.toLowerCase().includes(searchLower) ||
        emoji.includes(search)
      )
    })
  }, [search])

  return (
    <Popover
      {...popover.displayProps}
      slotProps={{
        paper: {
          sx: { maxHeight: 400, width: 320, overflow: 'hidden' },
        },
      }}
    >
      <Stack sx={{ height: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('iconPickerSearch')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 1 }}>
          {filteredIcons ? (
            // Search results
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 0.5,
              }}
            >
              {filteredIcons.map(iconName => (
                <IconButton
                  key={iconName}
                  iconName={iconName}
                  selected={value === iconName}
                  onClick={() => handleIconClick(iconName)}
                />
              ))}
              {filteredIcons.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ gridColumn: '1 / -1', py: 2, textAlign: 'center' }}
                >
                  No icons found
                </Typography>
              )}
            </Box>
          ) : (
            // Categories view
            <Stack spacing={1.5}>
              {Object.entries(iconCategories).map(([key, { label, icons }]) =>
                icons.length > 0 ? (
                  <Box key={key}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 0.5 }}
                    >
                      {label}
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        gap: 0.5,
                      }}
                    >
                      {icons.map(iconName => (
                        <IconButton
                          key={iconName}
                          iconName={iconName}
                          selected={value === iconName}
                          onClick={() => handleIconClick(iconName)}
                        />
                      ))}
                    </Box>
                  </Box>
                ) : null
              )}
            </Stack>
          )}
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            {t('iconPickerCustom')}
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              placeholder="🎯"
              value={customEmoji}
              onChange={e => setCustomEmoji(e.target.value)}
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  sx: { fontSize: 20 },
                },
              }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleCustomEmojiSubmit}
              disabled={!customEmoji.trim()}
            >
              OK
            </Button>
          </Stack>
        </Box>

        <Divider />

        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            size="small"
            onClick={() => handleIconClick(null)}
            color="inherit"
          >
            {t('iconPickerClear')}
          </Button>
        </Box>
      </Stack>
    </Popover>
  )
}

type IconButtonProps = {
  iconName: TIconName
  selected: boolean
  onClick: () => void
}

const IconButton: FC<IconButtonProps> = ({ iconName, selected, onClick }) => {
  const emoji = tagIcons[iconName]
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        border: 'none',
        borderRadius: 1,
        cursor: 'pointer',
        bgcolor: selected ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
      title={iconName.split('_').slice(1).join(' ')}
    >
      {emoji}
    </Box>
  )
}
