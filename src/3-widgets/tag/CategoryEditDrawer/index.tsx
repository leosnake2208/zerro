import React, { FC, useCallback } from 'react'
import { TTagId } from '6-shared/types'
import { registerPopover } from '6-shared/historyPopovers'
import { CategoryEditDrawer } from './CategoryEditDrawer'

export type CategoryEditDrawerProps = {
  tagId?: TTagId // undefined = create new category
}

const drawerHooks = registerPopover<CategoryEditDrawerProps>(
  'category-edit-drawer',
  {}
)

export const useCategoryEditDrawer = () => {
  const { open } = drawerHooks.useMethods()
  return useCallback((tagId?: TTagId) => open({ tagId }), [open])
}

export const SmartCategoryEditDrawer: FC = () => {
  const { displayProps, extraProps } = drawerHooks.useProps()
  return <CategoryEditDrawer {...displayProps} {...extraProps} />
}

export { IconPicker } from './IconPickerPopover'
