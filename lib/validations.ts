import { z } from 'zod'

// Loan application validation based on PRD spec
export const loanApplicationSchema = z.object({
  borrowerInfo: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Valid email address is required for notifications'),
    phone: z.string().optional(),
    ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/,
      'Invalid SSN format (expected ###-##-####)'
    ).optional(),
    monthlyIncome: z.number().min(0, 'Income must be positive').optional(),
  }),
  propertyInfo: z.object({
    address: z.string().min(5, 'Address is required'),
    purchasePrice: z.number().min(1000, 'Purchase price must be valid').optional(),
  }),
  loanDetails: z.object({
    loanAmount: z.number().min(1000, 'Loan amount must be valid'),
    loanTerm: z.number().min(1).max(40, 'Loan term must be between 1-40 years'),
    interestRate: z.number().min(0).max(20, 'Interest rate must be between 0-20%'),
  }),
})

// Email notification request schema
export const emailNotificationSchema = z.object({
  borrowerEmail: z.string().email('Valid email required'),
  borrowerName: z.string().min(1, 'Borrower name required'),
  loanDetails: z
    .object({
      loanId: z.string(),
      loanAmount: z.number(),
      interestRate: z.number(),
      monthlyPayment: z.number(),
    })
    .optional(),
  conditions: z.array(z.string()).optional(),
})

// Document upload schema (browser-only File type)
export const documentUploadSchema = z.object({
  files: z.any().array().min(1, 'At least one document is required'),
})


