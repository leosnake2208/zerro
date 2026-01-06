import React, { FC, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Fab,
  Collapse,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { tagModel, TagTreeNode } from '5-entities/tag'
import { TagIcon } from '6-shared/ui/TagIcon'
import { useCategoryEditDrawer, SmartCategoryEditDrawer } from '../CategoryEditDrawer'
import tagIcons from '6-shared/tagIcons.json'

type CategoryListDrawerProps = {
  open: boolean
  onClose: () => void
}

export const CategoryListDrawer: FC<CategoryListDrawerProps> = ({
  open,
  onClose,
}) => {
  const { t } = useTranslation('categoryEditor')
  const tagsTree = tagModel.useTagsTree()
  const tags = tagModel.usePopulatedTags()
  const openEditDrawer = useCategoryEditDrawer()

  const [search, setSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    if (!search.trim()) return tagsTree

    const searchLower = search.toLowerCase()

    // Find all matching tags (including children)
    const matchingIds = new Set<string>()
    Object.values(tags).forEach(tag => {
      if (tag.name.toLowerCase().includes(searchLower)) {
        matchingIds.add(tag.id)
        // Also add parent to show hierarchy
        if (tag.parent) {
          matchingIds.add(tag.parent)
        }
      }
    })

    // Filter tree to only show matching tags
    return tagsTree.filter(
      node =>
        matchingIds.has(node.id) ||
        node.children.some(child => matchingIds.has(child.id))
    )
  }, [tagsTree, tags, search])

  const handleAddCategory = () => {
    openEditDrawer()
  }

  const handleCategoryClick = (tagId: string) => {
    openEditDrawer(tagId)
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        keepMounted={false}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100vw', sm: 400 },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6">{t('listTitle')}</Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('searchPlaceholder')}
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

        {/* List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {filteredTags.length === 0 ? (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              <Typography>{t('noCategories')}</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredTags.map(node => (
                <CategoryItem
                  key={node.id}
                  node={node}
                  tags={tags}
                  expanded={expandedIds.has(node.id)}
                  onToggleExpand={() => toggleExpand(node.id)}
                  onClick={handleCategoryClick}
                  searchTerm={search}
                />
              ))}
            </List>
          )}
        </Box>

        {/* FAB */}
        <Fab
          color="primary"
          onClick={handleAddCategory}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
          }}
        >
          <AddIcon />
        </Fab>
      </Drawer>

      <SmartCategoryEditDrawer />
    </>
  )
}

type CategoryItemProps = {
  node: TagTreeNode
  tags: ReturnType<typeof tagModel.usePopulatedTags>
  expanded: boolean
  onToggleExpand: () => void
  onClick: (id: string) => void
  searchTerm: string
  level?: number
}

const CategoryItem: FC<CategoryItemProps> = ({
  node,
  tags,
  expanded,
  onToggleExpand,
  onClick,
  searchTerm,
  level = 0,
}) => {
  const { t } = useTranslation('categoryEditor')
  const tag = tags[node.id]
  if (!tag) return null

  const hasChildren = node.children.length > 0
  const displayIcon = tag.icon
    ? (tagIcons as Record<string, string>)[tag.icon] || tag.icon
    : tag.symbol

  // Highlight matching text
  const highlightName = (name: string) => {
    if (!searchTerm.trim()) return name
    const idx = name.toLowerCase().indexOf(searchTerm.toLowerCase())
    if (idx === -1) return name
    return (
      <>
        {name.slice(0, idx)}
        <Box component="span" sx={{ bgcolor: 'warning.light', borderRadius: 0.5 }}>
          {name.slice(idx, idx + searchTerm.length)}
        </Box>
        {name.slice(idx + searchTerm.length)}
      </>
    )
  }

  return (
    <>
      <ListItemButton
        onClick={() => onClick(node.id)}
        sx={{
          pl: 2 + level * 3,
          pr: 1,
        }}
      >
        {hasChildren && (
          <IconButton
            size="small"
            onClick={e => {
              e.stopPropagation()
              onToggleExpand()
            }}
            sx={{ mr: 1 }}
          >
            {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
          </IconButton>
        )}
        {!hasChildren && <Box sx={{ width: 40 }} />}

        <ListItemIcon sx={{ minWidth: 40 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              bgcolor: tag.colorDisplay || 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            {displayIcon}
          </Box>
        </ListItemIcon>

        <ListItemText
          primary={highlightName(tag.name)}
          secondary={
            hasChildren
              ? t('subcategories', { count: node.children.length })
              : undefined
          }
          primaryTypographyProps={{
            noWrap: true,
            sx: { fontWeight: hasChildren ? 500 : 400 },
          }}
        />
      </ListItemButton>

      {/* Children */}
      {hasChildren && (
        <Collapse in={expanded}>
          {node.children.map(childTag => {
            if (!childTag) return null
            return (
              <ListItemButton
                key={childTag.id}
                onClick={() => onClick(childTag.id)}
                sx={{ pl: 2 + (level + 1) * 3 + 5 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      bgcolor: childTag.colorDisplay || 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                    }}
                  >
                    {childTag.icon
                      ? (tagIcons as Record<string, string>)[childTag.icon] ||
                        childTag.icon
                      : childTag.symbol}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={highlightName(childTag.name)}
                  primaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            )
          })}
        </Collapse>
      )}
    </>
  )
}
