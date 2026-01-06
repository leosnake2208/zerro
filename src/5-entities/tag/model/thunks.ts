import type {
  OptionalExceptFor,
  TTag,
  TTagId,
  TDeletionObject,
} from '6-shared/types'
import { DataEntity } from '6-shared/types'
import type { AppThunk } from 'store'
import { sendEvent } from '6-shared/helpers/tracking'
import { applyClientPatch } from 'store/data'
import { userModel } from '5-entities/user'
import { makeTag } from './makeTag'
import { getTags } from './model'

export type TTagDraft = OptionalExceptFor<TTag, 'id'>

export const patchTag =
  (draft: TTagDraft | TTagDraft[]): AppThunk<TTag[]> =>
  (dispatch, getState) => {
    const patched: TTag[] = []
    let list = Array.isArray(draft) ? draft : [draft]

    list.forEach(draft => {
      if (!draft.id) throw new Error('Trying to patch tag without id')
      if (draft.id === 'null') throw new Error('Trying to patch null tag')
      let current = getTags(getState())[draft.id]
      if (!current) throw new Error('Tag not found')
      patched.push({ ...current, ...draft, changed: Date.now() })
    })

    sendEvent('Tag: edit')
    dispatch(applyClientPatch({ tag: patched }))
    return patched
  }

export const createTag =
  (draft: OptionalExceptFor<TTag, 'title'>): AppThunk<TTag[]> =>
  (dispatch, getState) => {
    if (hasId(draft)) return dispatch(patchTag(draft))
    if (!draft.title) throw new Error('Trying to create tag without title')
    let user = userModel.getRootUserId(getState())
    if (!user) throw new Error('No user')
    const newTag = makeTag({ ...draft, user })

    sendEvent('Tag: create')
    dispatch(applyClientPatch({ tag: [newTag] }))
    return [newTag]
  }

const hasId = (tag: Partial<TTag>): tag is TTagDraft => !!tag.id

export const deleteTag =
  (tagId: TTagId): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const userId = userModel.getRootUserId(state)
    if (!userId) throw new Error('User is not defined')

    const currentTag = getTags(state)[tagId]
    if (!currentTag) throw new Error('Tag not found')

    // Check for children - prevent deletion of parent tags with children
    const allTags = getTags(state)
    const hasChildren = Object.values(allTags).some(t => t.parent === tagId)
    if (hasChildren) throw new Error('Cannot delete tag with children')

    const del: TDeletionObject = {
      id: tagId,
      object: DataEntity.Tag,
      stamp: Date.now(),
      user: userId,
    }

    sendEvent('Tag: delete')
    dispatch(applyClientPatch({ deletion: [del] }))
  }
