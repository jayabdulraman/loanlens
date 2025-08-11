"use client"

import { create } from 'zustand'
import type { LoanAssessmentData, EmailNotification } from '@/types/loan'

export type UploadedDocument = {
  id: string
  name: string
  size: number
  analysis?: unknown
}

type AppState = {
  // Documents
  uploadedDocuments: UploadedDocument[]
  setUploadedDocuments: (docs: UploadedDocument[]) => void
  addUploadedDocument: (doc: UploadedDocument) => void

  // Assessment (UI friendly)
  assessment: LoanAssessmentData | null
  setAssessment: (assessment: LoanAssessmentData | null) => void

  // Property snapshot for UI
  property: {
    estimatedValue: number
    confidence?: number
    lowEstimate?: number
    highEstimate?: number
    priceHistory?: Array<{ month: string; value: number }>
  } | null
  setProperty: (p: AppState['property']) => void

  // Email notifications history
  emailNotifications: EmailNotification[]
  addEmailNotification: (n: EmailNotification) => void
}

export const useAppStore = create<AppState>((set) => ({
  uploadedDocuments: [],
  setUploadedDocuments: (docs) => set({ uploadedDocuments: docs }),
  addUploadedDocument: (doc) =>
    set((s) => ({ uploadedDocuments: [...s.uploadedDocuments, doc] })),

  assessment: null,
  setAssessment: (assessment) => set({ assessment }),

  property: null,
  setProperty: (property) => set({ property }),

  emailNotifications: [],
  addEmailNotification: (n) => set((s) => ({ emailNotifications: [n, ...s.emailNotifications] })),
}))


