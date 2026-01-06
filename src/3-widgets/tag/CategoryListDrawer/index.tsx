import React, { FC, useCallback } from 'react'
import { registerPopover } from '6-shared/historyPopovers'
import { CategoryListDrawer } from './CategoryListDrawer'

const drawerHooks = registerPopover<{}>('category-list-drawer', {})

export const useCategoryListDrawer = () => {
  const { open } = drawerHooks.useMethods()
  return useCallback(() => open({}), [open])
}

export const SmartCategoryListDrawer: FC = () => {
  const { displayProps } = drawerHooks.useProps()
  return <CategoryListDrawer {...displayProps} />
}
