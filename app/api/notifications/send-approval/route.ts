import { NextRequest, NextResponse } from 'next/server'
import { sendLoanApprovalEmail, type LoanApprovalDetails } from '@/lib/composio/gmail-client'
import { useAppStore } from '@/lib/store/app-store'
import type { EmailNotification } from '@/types/loan'
import { lpushJSON } from '@/lib/upstash'

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

    // Build notification record
    const notification: EmailNotification = {
      id: result.messageId || `msg-${Date.now()}`,
      type: 'approval',
      recipientEmail: borrowerEmail,
      sentAt: new Date(),
      status: 'sent',
      messageId: result.messageId,
      template: 'approval',
      content: {
        subject: '🎉 Great News! Your Loan Application Has Been Approved',
        htmlBody: '<html>Approval Email</html>',
      },
    }

    // Persist to Upstash history
    await lpushJSON('emails:history', notification)

    // Optimistically update client store on next load through /api/analysis/latest or a future endpoint
    // (We avoid direct client store mutation in server route)

    return NextResponse.json({ success: true, messageId: result.messageId, notification })
  } catch {
    return NextResponse.json({ success: false, error: 'Notification failed' }, { status: 500 })
  }
}


