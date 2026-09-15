'use client'

import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { CommandWizard, CommandWizardData } from './CommandWizard'

export interface CommandEditorProps {
  open: boolean
  onClose: () => void
  initialData?: Partial<CommandWizardData>
  onSave: (data: any) => Promise<void>
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
      title={initialData?.id ? 'Edit Command Wizard' : 'Create Custom Command Wizard'}
      subtitle="10-Step Wizard for configuring triggers, parameters, response templates, permissions, API, AI, and live testing."
      maxWidth="3xl"
    >
      <CommandWizard initialData={initialData} onSave={onSave} saving={saving} />
    </Modal>
  )
}
