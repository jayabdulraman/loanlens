// Core borrower information used across the app
export interface BorrowerInfo {
  firstName: string
  lastName: string
  email: string
  phone?: string
  ssn?: string
  dateOfBirth?: string
  employmentStatus?: string
  yearsAtCurrentJob?: number
  monthlyIncome?: number
}

// UI-focused assessment data consumed by `components/loan-assessment.tsx`
export interface LoanAssessmentData {
  eligibilityStatus: 'approved' | 'conditional' | 'denied'
  eligibilityReason: string
  ltv: number
  dti: number
  creditScore: number
  suggestions: string[]
  borrowerInfo: BorrowerInfo
  // Optional additional fields used by email composition
  loanAmount?: number
  interestRate?: number
  monthlyPayment?: number
}

// Domain model for a loan application
export interface LoanApplication {
  id: string
  borrowerInfo: BorrowerInfo
  propertyInfo: PropertyInfo
  loanDetails: LoanDetails
  financialData?: FinancialData
  documents?: Array<unknown>
  assessment?: LoanAssessment
  emailNotifications?: EmailNotification[]
}

export interface PropertyInfo {
  address: string
  zipCode?: string
  purchasePrice?: number
}

export interface LoanDetails {
  loanAmount: number
  loanTerm: number // years
  interestRate: number // percent
}

export interface FinancialData {
  monthlyIncome: number
  monthlyDebtPayments: number
}

export interface LoanAssessment {
  eligibilityStatus: 'approved' | 'conditional' | 'denied'
  eligibilityReason: string
  riskScore?: number
  recommendations?: string[]
  requiredDocuments?: string[]
  conditions?: string[]
  emailSent?: boolean
  emailSentAt?: Date
  nextSteps?: string[]
}

export interface EmailNotification {
  id: string
  type: 'approval' | 'conditional' | 'denial' | 'follow-up'
  recipientEmail: string
  sentAt: Date
  status: 'sent' | 'delivered' | 'opened' | 'failed'
  messageId?: string
  template: string
  content: EmailContent
}

export interface EmailContent {
  subject: string
  htmlBody: string
  attachments?: EmailAttachment[]
}

export interface EmailAttachment {
  filename: string
  content: Buffer
  contentType: string
}

export interface LoanApprovalDetails {
  loanId: string
  loanAmount: number
  interestRate: number
  loanTerm: number
  monthlyPayment: number
  propertyAddress: string
  ltv: number
  dti: number
  creditScore: number
  approvalDate?: Date
  expirationDate?: Date
}

