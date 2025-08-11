import { NextRequest, NextResponse } from 'next/server'
import { sendLoanApprovalEmail, type LoanApprovalDetails } from '@/lib/composio/gmail-client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { borrowerEmail, borrowerName, loanDetails } = (await req.json()) as {
      borrowerEmail: string
      borrowerName: string
      loanDetails: LoanApprovalDetails
    }

    if (!borrowerEmail || !borrowerName || !loanDetails) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const result = await sendLoanApprovalEmail(borrowerEmail, borrowerName, loanDetails)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error ?? 'Email failed' }, { status: 502 })
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch {
    return NextResponse.json({ success: false, error: 'Notification failed' }, { status: 500 })
  }
}


