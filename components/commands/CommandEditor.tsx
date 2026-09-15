'use client'

import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { CommandForm, CommandFormData } from './CommandForm'

export interface CommandEditorProps {
  open: boolean
  onClose: () => void
  initialData?: Partial<CommandFormData>
  onSave: (data: CommandFormData) => Promise<void>
  saving?: boolean
}

export function CommandEditor({
  open,
  onClose,
  initialData,
  onSave,
  saving = false,
}: CommandEditorProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData?.id ? 'Edit Command' : 'Create Custom Command'}
      subtitle="Configure triggers, decorations, mode scopes, limits, roles, and AI/API settings."
      maxWidth="2xl"
    >
      <CommandForm initialData={initialData} onSave={onSave} saving={saving} />
    </Modal>
  )
}
